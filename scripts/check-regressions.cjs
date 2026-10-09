// Pruebas de reglas y persistencia con servicios externos simulados; no usa cuentas reales.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const crypto = require('node:crypto');
const aliases = { services: 'src/services', lib: 'src/lib', stores: 'src/stores' };
let remote = false, online = false, diskFailure = null, clock = '2026-10-08T12:00:00-05:00';
const local = new Map(), wire = new Map();
const clone = value => JSON.parse(JSON.stringify(value));
const db = { lget: async (key, fallback) => clone(local.get(key) ?? fallback), lset: async (key, value) => { if (key === diskFailure) throw new Error('disco'); local.set(key, clone(value)); } };
const storage = { getItem: async key => local.has(key) ? JSON.stringify(local.get(key)) : null, setItem: async (key, value) => { if (key === diskFailure) throw new Error('disco'); local.set(key, JSON.parse(value)); }, getAllKeys: async () => [...local.keys()], multiRemove: async keys => keys.forEach(k => local.delete(k)), multiGet: async keys => keys.map(k => [k, local.has(k) ? JSON.stringify(local.get(k)) : null]) };
let prediction = null, requestedTable = '';
const supabase = { from(table) {
  requestedTable = table;
  const chain = { select() { return chain; }, eq() { return chain; }, gte() { return chain; }, order() { return chain; }, limit() { return chain; },
    maybeSingle: async () => ({ data: prediction, error: null }),
    range: async () => online ? { data: [...wire.values()], error: null } : { data: null, error: { message: 'offline' } },
    upsert: async rows => { if (!online) return { error: { message: 'offline' } }; for (const r of rows) if (!wire.has(r.evento_uuid)) wire.set(r.evento_uuid, clone(r)); return { error: null }; } };
  return chain;
} };
let lecturasPasos = 0, lecturasOtros = 0, permisosAutomaticos = null, sensorRows = [], alLeerPasos = null;
const mocks = {
  '@services/localDb': db, '@services/mode': { isRemote: () => remote }, '@lib/supabase': { supabase },
  '@react-native-async-storage/async-storage': { default: storage, ...storage },
  '@stores/authStore': { useAuthStore: { getState: () => ({ demoMode: !remote }) } },
  'react-native': { Platform: { OS: 'web' } },
  'expo-crypto': { randomUUID: crypto.randomUUID, CryptoDigestAlgorithm: { SHA256: 'sha256' }, digestStringAsync: async (_algo, key) => crypto.createHash('sha256').update(key).digest('hex') },
  'expo-notifications': {}, '@services/notificaciones': { solicitarPermisosNotificacion: async () => ({ concedido: false }) },
  'expo-location': { getForegroundPermissionsAsync: async () => { lecturasOtros++; throw new Error('No leer GPS'); } },
  'expo-sensors': { Accelerometer: { isAvailableAsync: async () => { lecturasOtros++; return false; } }, Pedometer: {} },
  '@services/healthConnect': { leerHealthConnect: async (_id, consent) => { lecturasPasos++; permisosAutomaticos = consent; if (alLeerPasos) alLeerPasos(); return sensorRows; }, solicitarPermisosHealthConnect: async () => { throw new Error('No solicitar permisos automáticamente'); } },
};
const RealDate = Date;
class TestDate extends RealDate { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return new RealDate(clock).getTime(); } }
const cache = new Map();
function load(file) {
  file = path.resolve(root, file); if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const req = name => { if (name in mocks) return mocks[name]; const match = /^@(services|lib|stores)\/(.+)$/.exec(name); return match ? load(`${aliases[match[1]]}/${match[2]}.ts`) : require(name); };
  vm.runInNewContext(code, { require: req, module: mod, exports: mod.exports, Date: TestDate, console, __DEV__: true, setTimeout, clearTimeout, URL, Blob, Map, Set }, { filename: file });
  return mod.exports;
}
const event = (overrides = {}) => ({ evento_uuid: crypto.randomUUID(), procedencia: 'telefono', tipo_evento: 'ventana_actividad', inicio_en: clock, fin_en: clock, valor_numerico: null, valor_texto: 'desplazamiento', unidad: null, confianza: 75, zona_general: null, medido_directamente: false, disponibilidad: true, calidad: 75, version_consentimiento: 'v1.0', datos_minimos: {}, ...overrides });
const tests = [];
function test(name, fn) { tests.push([name, fn]); }
const metrics = load('src/services/metricas.ts');
const gemelo = load('src/services/gemelo.ts');
const queue = load('src/services/eventStore.ts');
test('Una observación puntual no inventa minutos; intervalos solapados se unen', () => {
  assert.equal(metrics.resumirEventos([event()]).minutosActivos, 0);
  const a = event({ inicio_en: '2026-10-08T10:00:00-05:00', fin_en: '2026-10-08T10:20:00-05:00' });
  const b = event({ inicio_en: '2026-10-08T10:10:00-05:00', fin_en: '2026-10-08T10:30:00-05:00' });
  assert.equal(metrics.resumirEventos([a, b, a]).minutosActivos, 30);
});
test('Rutina no rellena huecos entre lecturas separadas', () => {
  const blocks = gemelo.buildRutina([event({ inicio_en: '2026-10-08T10:00:00-05:00', fin_en: '2026-10-08T10:00:00-05:00' }), event({ inicio_en: '2026-10-08T10:10:00-05:00', fin_en: '2026-10-08T10:10:00-05:00' })]);
  assert.equal(blocks.length, 2); assert.equal(blocks.reduce((a, b) => a + b.duracionMin, 0), 0);
});
test('Pasos ficticios de correcciones antiguas se excluyen; totales acumulados no se duplican', () => {
  const manual = event({ unidad: 'pasos', valor_numerico: 120, datos_minimos: { calibracion_humana: true } });
  assert.equal(metrics.resumirEventos([manual]).pasosHoy, 0);
  const a = event({ tipo_evento: 'pasos', unidad: 'pasos', valor_numerico: 500, datos_minimos: { contador_total: 500 } });
  const b = event({ tipo_evento: 'pasos', unidad: 'pasos', valor_numerico: 200, datos_minimos: { contador_total: 700 } });
  assert.equal(metrics.resumirEventos([a, b, a, { ...b, evento_uuid: crypto.randomUUID() }]).pasosHoy, 700);
});
test('Sueño cruza medianoche sin confundirse con reposo ni duplicarse', () => {
  const sleep = event({ tipo_evento: 'sueno', inicio_en: '2026-10-07T23:00:00-05:00', fin_en: '2026-10-08T07:00:00-05:00', valor_numerico: 480, datos_minimos: { sesion_sueno: true } });
  const r = metrics.resumirEventos([sleep, sleep, event({ valor_texto: 'permanencia' })]);
  assert.equal(r.minutosSueno, 480); assert.equal(r.minutosDescanso, 0); assert.equal(metrics.diaDelEvento(sleep), '2026-10-08');
  assert.equal(metrics.resumirEventos([event({ tipo_evento: 'sueno', valor_numerico: 400 }), event({ tipo_evento: 'sueno', valor_numerico: 480 })]).minutosSueno, 480);
});
test('Una línea base personal exige tres días medidos y una lectura vieja no genera predicción', () => {
  const baseline = load('src/services/lineaBase.ts'); const now = new TestDate();
  const today = [event({ tipo_evento: 'pasos', unidad: 'pasos', valor_numerico: 100 })];
  const past = [5, 6, 7].map(day => event({ tipo_evento: 'pasos', unidad: 'pasos', valor_numerico: 100, inicio_en: `2026-10-0${day}T10:00:00-05:00`, fin_en: null }));
  assert.equal(baseline.calcularVariacionRutina(today, now).nivel, 'datos_insuficientes');
  assert.equal(baseline.calcularVariacionRutina(today, now, past).nivel, 'estable');
  assert.equal(gemelo.buildGemelo([event({ inicio_en: '2026-10-08T09:00:00-05:00' })]).prediccion, null);
  assert.equal(gemelo.buildGemelo([event()]).fuentePrediccion, 'reglas');
});
test('La predicción cloud vence con su horizonte y rechaza probabilidades inválidas', async () => {
  remote = true; prediction = { actividad_predicha: 'estudio', probabilidad: .8, horizonte_minutos: 30, generada_en: clock, variables_relevantes: [] };
  assert.equal((await gemelo.fetchPrediccionRF('u')).fuente, 'rf');
  prediction.generada_en = '2026-10-08T10:00:00-05:00'; assert.equal(await gemelo.fetchPrediccionRF('u'), null);
  prediction.generada_en = clock; prediction.probabilidad = 80; assert.equal(await gemelo.fetchPrediccionRF('u'), null); remote = false;
});
test('Guardar offline, recuperar cola y reintentar dos veces mantiene un solo evento por UUID', async () => {
  local.clear(); wire.clear(); remote = true; online = false; const e = event();
  await queue.guardarEventos('u', [e]); assert.equal((await queue.estadoSincronizacion('u')).pendientes, 1);
  assert.equal((await queue.leerEventosDesde('u', new TestDate('2026-10-08T00:00:00-05:00'))).length, 1);
  online = true; await queue.sincronizarEventos('u'); await queue.guardarEventos('u', [e]);
  assert.equal(wire.size, 1); assert.equal((await queue.estadoSincronizacion('u')).pendientes, 0); assert.equal(wire.get(e.evento_uuid).usuario_id, 'u');
  remote = false;
});
test('Un fallo de disco no anuncia éxito; la cola anterior permite recuperar la captura', async () => {
  local.clear(); wire.clear(); remote = true; online = false; diskFailure = 'events:u'; const e = event();
  await assert.rejects(queue.guardarEventos('u', [e]), /disco/);
  assert.equal(local.get('pending:u').length, 1); diskFailure = null; online = true;
  await queue.sincronizarEventos('u'); assert.equal(local.get('events:u').length, 1); assert.equal(wire.size, 1);
  remote = false;
});
test('Demo no sube registros aunque haya un backend configurado', async () => {
  local.clear(); wire.clear(); remote = true; online = true;
  await queue.guardarEventos('demo-user', [event()]); assert.equal(wire.size, 0); assert.equal(local.has('pending:demo-user'), false); remote = false;
});
test('La semana promedia solo días medidos y no compara periodos sin cobertura', () => {
  const history = load('src/services/historial.ts'); const compare = load('src/services/resumenSemanal.ts');
  const days = [ { pasosHoy: 100, tienePasos: true, totalEventos: 1, minutosActivos: 0 }, { pasosHoy: 0, tienePasos: false, totalEventos: 1, minutosActivos: 0 } ];
  assert.equal(history.calcularSemana(days).promediopasos, 100);
  assert.match(compare.compararSemanas(days, []).detalle, /tres días/);
});
test('Apariencia persistida por cuenta y valores inválidos recuperan una opción segura', async () => {
  local.clear(); const prefs = load('src/services/preferencias.ts');
  await prefs.savePreferencias('u', { aspecto: 'mascota', color: 'violeta' }); assert.equal((await prefs.fetchPreferencias('u')).aspecto, 'mascota');
  assert.equal((await prefs.fetchPreferencias('otra')).aspecto, 'neutral'); local.set('preferencias:u', { aspecto: 'incorrecto' }); assert.equal((await prefs.fetchPreferencias('u')).aspecto, 'neutral');
});
test('Metas de sueño usan sueño, no minutos de descanso', () => {
  const metas = load('src/services/metas.ts');
  assert.equal(metas.calcularProgreso({ pasos: 1000, minutosActivos: 30, horasSueno: 8 }, { pasosHoy: 0, minutosActivos: 0, minutosDescanso: 480, minutosSueno: 0 }).horasSueno.actual, 0);
});
test('Plan personal valida hora/texto y marcar no duplica una fecha', async () => {
  local.clear(); const plan = load('src/services/planPersonal.ts');
  await assert.rejects(plan.agregarPlan('u', '2026-10-09', 'Mi paseo', '25:30'));
  await plan.agregarPlan('u', '2026-10-09', 'Mi paseo', '08:30'); assert.equal((await plan.fetchPlanes('u', '2026-10-09')).length, 1);
  await plan.guardarCambio('u', 'Hacer una pausa'); await plan.marcarCambio('u'); assert.equal((await plan.fetchCambio('u')).realizados.length, 1);
  await plan.marcarCambio('u'); assert.equal((await plan.fetchCambio('u')).realizados.length, 0);
});
test('Pro de prueba caducado vuelve a Free', async () => {
  local.clear(); const sub = load('src/services/suscripcion.ts');
  local.set('ando-suscripcion-u', { tier: 'pro', expiraEn: '2026-10-07T00:00:00Z' }); assert.equal((await sub.fetchSuscripcion('u')).tier, 'free');
  await sub.activarPro('u'); assert.equal((await sub.fetchSuscripcion('u')).tier, 'pro');
});
test('No hay alertas por datos ausentes ni diagnóstico a partir del pulso diario', () => {
  const alerts = load('src/services/alertas.ts'); const empty = gemelo.buildGemelo([]);
  assert.equal(alerts.generarAlertas(empty).length, 0);
  const measured = gemelo.buildGemelo([event()]); const messages = alerts.generarAlertas(measured, 120);
  assert.ok(messages.every(a => a.tipo !== 'peligro')); assert.match(messages[0].detalle, /no determina/);
});
test('Guardar y leer usa el prefijo real; un JSON corrupto no se trata como registro vacío', async () => {
  local.clear(); const realDb = load('src/services/localDb.ts');
  await realDb.lset('events:u', [event()]); assert.ok(local.has('ando:local:events:u'));
  assert.equal((await realDb.lget('events:u', [])).length, 1);
  diskFailure = 'ando:local:events:u'; await assert.rejects(realDb.lset('events:u', []), /disco/); diskFailure = null;
  assert.equal((await realDb.lget('events:u', [])).length, 1);
});
test('Eliminar cuenta valida el JWT y usa su titular, nunca el id del body', async () => {
  let handler, deletedId = null, authError = false, deleteError = false;
  const api = { auth: { getUser: async () => ({ data: { user: authError ? null : { id: 'titular-validado' } }, error: authError }), admin: { deleteUser: async id => { deletedId = id; return { error: deleteError }; } } } };
  const file = 'supabase/functions/delete-account/index.ts';
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: {}, require: () => ({ createClient: () => api }), Request, Response, Deno: { env: { get: () => 'valor-simulado' }, serve: fn => { handler = fn; } } });
  assert.equal((await handler(new Request('https://test.local', { method: 'POST' }))).status, 401); assert.equal(deletedId, null);
  const request = () => new Request('https://test.local', { method: 'POST', headers: { Authorization: 'Bearer token-simulado', 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'otra-persona' }) });
  authError = true; assert.equal((await handler(request())).status, 401); assert.equal(deletedId, null);
  authError = false; const ok = await handler(request()); assert.equal(deletedId, 'titular-validado'); assert.equal((await ok.json()).deleted, true);
  deleteError = true; assert.equal((await handler(request())).status, 409);
});
const impacto = load('src/services/impacto.ts');
const step = (overrides = {}) => event({ tipo_evento: 'pasos', unidad: 'pasos', valor_numerico: 100, medido_directamente: true, ...overrides });
test('Impacto automático distingue lectura de cero de ausencia y convierte pasos a km', () => {
  for (const value of [null, NaN, Infinity, -1]) assert.equal(impacto.impactoDePasos(value).tieneDatos, false);
  assert.equal(impacto.impactoDePasos(0).tieneDatos, true);
  const result = impacto.impactoDePasos(1000);
  assert.equal(result.distanciaKm, .7);
  assert.ok(Math.abs(result.gramosCO2Auto - 173.9839338) < .001);
  assert.match(impacto.formatoCO2(25), /25 g/);
  assert.match(impacto.formatoCO2(2000), /2 kg/);
});
test('Impacto no convierte acelerómetro, entradas manuales ni ejemplos en pasos reales', () => {
  const rows = [event({ unidad: 'pasos', valor_numerico: 100 }), step({ procedencia: 'manual' }), step({ datos_minimos: { calibracion_humana: true } }), step({ datos_minimos: { simulado: true } }), step({ valor_numerico: NaN }), step({ datos_minimos: { contador_total: Infinity } }), step({ disponibilidad: false })];
  assert.equal(impacto.resumirImpactoAutomatico(rows).hoy.tieneDatos, false);
  assert.equal(impacto.resumirImpactoAutomatico(rows, new TestDate(), true).hoy.pasos, 100);
});
test('Impacto no suma dos veces contadores diarios, fuentes solapadas o el mismo UUID', () => {
  const a = step({ datos_minimos: { contador_total: 500 } });
  const b = step({ datos_minimos: { contador_total: 700 } });
  const rows = [a, b, a, step({ valor_numerico: 200 })];
  assert.equal(impacto.resumirImpactoAutomatico(rows).hoy.pasos, 700);
  assert.equal(impacto.resumirImpactoAutomatico(rows).hoy.pasos, 700);
  const increment = step({ valor_numerico: 200 });
  assert.equal(impacto.resumirImpactoAutomatico([increment, increment, step()]).hoy.pasos, 300);
});
test('Impacto semanal excluye futuro y días fuera del periodo, sin inventar cobertura', () => {
  const rows = [1, 2, 8, 9].map(day => step({ inicio_en: `2026-10-${String(day).padStart(2,'0')}T10:00:00-05:00` }));
  const today = impacto.resumirImpactoAutomatico(rows, new TestDate());
  assert.equal(today.hoy.pasos, 100); assert.equal(today.sieteDias.pasos, 200);
  assert.equal(today.sieteDias.diasConDatos, 2);
  const tomorrow = impacto.resumirImpactoAutomatico(rows, new TestDate('2026-10-09T12:00:00-05:00'));
  assert.equal(tomorrow.hoy.pasos, 100); assert.equal(tomorrow.sieteDias.diasConDatos, 2);
  assert.equal(impacto.resumirImpactoAutomatico([step({ inicio_en: '2026-10-08T13:00:00-05:00' })]).hoy.tieneDatos, false);
});
test('Actualización automática no lee sensores sin permiso de pasos ni cambia otros permisos', async () => {
  local.clear(); lecturasPasos = 0; lecturasOtros = 0;
  const sensors = load('src/services/sensors.ts');
  assert.equal(await sensors.capturarPasosAutomaticos('u', { pasos: false }), 0);
  assert.equal(lecturasPasos, 0);
  sensorRows = [step()];
  const consents = { pasos: true, actividad: true, zona_general: true, sueno: true, wearable: true, fisiologia: true, ambiente: true };
  await sensors.capturarPasosAutomaticos('u', consents, () => true);
  assert.equal(lecturasPasos, 1); assert.equal(lecturasOtros, 0);
  for (const key of ['actividad','zona_general','sueno','wearable','fisiologia','ambiente']) assert.equal(permisosAutomaticos[key], false);
  assert.equal(consents.actividad, true);
});
test('Revocar permiso o cambiar sesión durante una lectura automática impide guardarla', async () => {
  local.clear();
  const sensors = load('src/services/sensors.ts');
  let autorizado = true;
  alLeerPasos = () => { autorizado = false; };
  assert.equal(await sensors.capturarPasosAutomaticos('u', { pasos: true }, () => autorizado), 0);
  assert.equal(local.has('events:u'), false);
  alLeerPasos = null; lecturasPasos = 0;
  assert.equal(await sensors.capturarPasosAutomaticos('u', { pasos: true }, () => false), 0);
  assert.equal(lecturasPasos, 0);
});
test('Reconsultar automáticamente conserva un solo evento y propaga errores de disco', async () => {
  local.clear();
  const sensors = load('src/services/sensors.ts');
  sensorRows = [step({ datos_minimos: { contador_total: 120 } })];
  await sensors.capturarPasosAutomaticos('u', { pasos: true });
  await sensors.capturarPasosAutomaticos('u', { pasos: true });
  assert.equal(local.get('events:u').length, 1);
  assert.equal(impacto.resumirImpactoAutomatico(local.get('events:u')).hoy.pasos, 120);
  diskFailure = 'events:u';
  await assert.rejects(sensors.capturarPasosAutomaticos('u', { pasos: true }), /disco/);
  diskFailure = null;
  assert.equal(local.get('events:u').length, 1);
});
(async () => { for (const [name, fn] of tests) { await fn(); console.log(`OK · ${name}`); } console.log(`${tests.length} comprobaciones aprobadas.`); })().catch(e => { console.error(e); process.exitCode = 1; });
