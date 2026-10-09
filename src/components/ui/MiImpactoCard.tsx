import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Info, Leaf } from "lucide-react-native";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { Button } from "@components/ui/Button";
import { BottomSheet } from "@components/ui/BottomSheet";
import { useImpacto } from "@hooks/useImpacto";
import { formatoCO2, REFERENCIA_CO2 } from "@services/impacto";
import { colors } from "@theme/colors";

/** Pasos → distancia aproximada → comparación en auto, sin atribuir viajes evitados. */
export function MiImpactoCard() {
  const router = useRouter();
  const { query, resumen, demo, autorizado, cargandoPermisos, errorPermisos } = useImpacto();
  const [metodo, setMetodo] = useState(false);
  const [errorEnlace, setErrorEnlace] = useState(false);
  const km = (value: number) => value.toLocaleString("es-PE", { maximumFractionDigits: 2 });
  const hora = resumen.ultimaLectura ? new Date(resumen.ultimaLectura).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;

  return <>
    <Card glass className="mt-5 border-brand-500/20" delay={280}>
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-2xl bg-brand-500/15 items-center justify-center"><Leaf size={22} color={colors.brandCyan} /></View>
        <Text className="text-white font-semibold text-lg flex-1">Mi impacto</Text>
        <Chip label={demo ? "Demo" : "Automático"} tone="mint" />
      </View>
      {cargandoPermisos || query.isLoading ? <Text className="text-ink-300 text-sm mt-3">Consultando tus pasos…</Text>
        : errorPermisos ? <Text className="text-ink-300 text-sm mt-3">No pudimos comprobar tu permiso de pasos. Actualiza el resumen para reintentar.</Text>
        : !autorizado && !demo ? <>
          <Text className="text-white font-semibold text-base mt-4">Tu impacto se calcula solo</Text>
          <Text className="text-ink-300 text-sm leading-5 mt-1">Activa el permiso de pasos en Perfil. Después verás aquí la comparación sin ingresar datos.</Text>
          <View className="mt-3"><Button size="sm" variant="secondary" label="Ver permisos" onPress={() => router.push("/(tabs)/perfil")} /></View>
        </> : <>
          {resumen.hoy.tieneDatos ? <>
            <Text className="text-white font-display-bold text-3xl mt-4">≈ {formatoCO2(resumen.hoy.gramosCO2Auto)}</Text>
            <Text className="text-ink-200 text-sm mt-1">de CO₂ en un recorrido equivalente en auto</Text>
            <Text className="text-brand-200 text-sm mt-2">{resumen.hoy.pasos.toLocaleString("es-PE")} pasos hoy · ≈ {km(resumen.hoy.distanciaKm)} km a pie</Text>
          </> : <>
            <Text className="text-white font-semibold text-base mt-4">Esperando una lectura de pasos</Text>
            <Text className="text-ink-300 text-sm leading-5 mt-1">Aparecerá automáticamente cuando tu teléfono comparta pasos autorizados.</Text>
          </>}
          {resumen.sieteDias.tieneDatos && <View className="rounded-2xl bg-brand-500/10 px-3 py-2.5 mt-3">
            <Text className="text-brand-200 text-xs">Últimos 7 días · ≈ {formatoCO2(resumen.sieteDias.gramosCO2Auto)} de CO₂ en auto</Text>
            <Text className="text-ink-300 text-xs mt-1">≈ {km(resumen.sieteDias.distanciaKm)} km a pie · {resumen.sieteDias.diasConDatos} {resumen.sieteDias.diasConDatos === 1 ? "día con lecturas" : "días con lecturas"}</Text>
          </View>}
          <Text className="text-ink-400 text-xs leading-4 mt-3">{demo ? "Vista demo: puede incluir datos de prueba." : hora ? `Actualización automática · Última lectura ${hora}` : "Se actualiza con las lecturas disponibles del teléfono."}</Text>
          <Text className="text-ink-300 text-xs leading-5 mt-2">Es una comparación estimada. Hay ahorro si caminar reemplaza un viaje en auto.</Text>
          {query.isError && <View className="mt-3 gap-2">
            <Text className="text-ink-300 text-xs">No pudimos actualizar. {query.data ? "Mostramos las últimas lecturas guardadas." : "Reintentaremos automáticamente."}</Text>
            <Button size="sm" variant="ghost" label="Reintentar" loading={query.isFetching} onPress={() => { void query.refetch(); }} />
          </View>}
        </>}
      <Pressable accessibilityRole="button" onPress={() => { setErrorEnlace(false); setMetodo(true); }} className="flex-row items-center gap-2 pt-3" style={{ minHeight: 44 }}>
        <Info size={16} color={colors.brandCyan} /><Text className="text-brand-300 text-xs font-semibold">Cómo se calcula</Text>
      </Pressable>
    </Card>
    <BottomSheet visible={metodo} title="Así calculamos tu impacto" onClose={() => setMetodo(false)}>
      <View className="gap-4">
        <Text className="text-white text-lg font-semibold">Tus pasos, sin llenar formularios</Text>
        <Text className="text-ink-200 text-sm leading-6">Usamos los pasos disponibles del teléfono. Aproximamos la distancia con 0,70 metros por paso y la comparamos con un recorrido de esa distancia en auto a gasolina.</Text>
        <Text className="text-ink-300 text-sm leading-6">La longitud del paso es un supuesto fijo y puede variar entre personas y actividades. La distancia y el CO₂ son aproximaciones, no mediciones.</Text>
        <Text className="text-ink-300 text-sm leading-6">Un auto de referencia emite aproximadamente 249 g de CO₂/km por el escape. Fuente EPA: 400 g por milla para un auto promedio a gasolina de EE. UU. No es un factor específico del Perú ni de tu vehículo.</Text>
        <Text className="text-ink-300 text-sm leading-6">Los sensores no saben si habrías usado un auto. También pueden contar pasos dentro de casa o al hacer ejercicio. Por eso mostramos una comparación y no afirmamos que todo ese CO₂ se haya evitado.</Text>
        <Text className="text-ink-300 text-sm leading-6">En iPhone usamos el podómetro y en Android, Health Connect en una compilación compatible y con permisos del sistema. El dispositivo decide cuándo ofrece lecturas en segundo plano. No se utiliza GPS para esta estimación.</Text>
        <Button variant="ghost" size="sm" label="Ver fuente EPA" onPress={() => { Linking.openURL(REFERENCIA_CO2.url).catch(() => setErrorEnlace(true)); }} />
        {errorEnlace && <Text className="text-error text-xs">No se pudo abrir la fuente. Intenta nuevamente.</Text>}
      </View>
    </BottomSheet>
  </>;
}

