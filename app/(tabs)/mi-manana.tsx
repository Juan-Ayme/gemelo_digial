import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PageHeader } from "@components/ui/PageHeader";
import { SegmentedControl } from "@components/ui/SegmentedControl";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { TextInput } from "@components/ui/TextInput";
import { usePlanPersonal } from "@hooks/usePlanPersonal";
import { fechaManana } from "@services/planPersonal";
import { fechaLocal } from "@services/metricas";

export default function MiManana() {
  const [verHoy, setVerHoy] = useState(false), [fecha, setFecha] = useState(fechaLocal(new Date()));
  const dia = verHoy ? fecha : fechaManana(); const { query, add, update } = usePlanPersonal(dia);
  const [texto, setTexto] = useState(""), [hora, setHora] = useState("08:30");
  useEffect(() => { const timer = setInterval(() => setFecha(fechaLocal(new Date())), 60000); return () => clearInterval(timer); }, []);
  return <Screen scroll>
    <PageHeader title={verHoy ? "Mi plan de hoy" : "Mi mañana"} subtitle="Prepara unos pocos momentos, a tu ritmo." />
    <View className="mt-5"><SegmentedControl label="Día del plan" value={verHoy ? "hoy" : "manana"} onChange={value => setVerHoy(value === "hoy")} options={[{ value: "hoy", label: "Hoy" }, { value: "manana", label: "Mañana" }]} /></View>
    <Text className="text-ink-400 text-xs mt-3">{dia} · Plan personal guardado en este dispositivo</Text>
    {query.isLoading && <Text className="text-ink-300 mt-4">Cargando tu plan…</Text>}
    {!query.isLoading && !query.data?.length && <Card className="mt-4"><Text className="text-white font-semibold">Un día con espacio para ti</Text><Text className="text-ink-300 text-sm mt-2">Añade tu primer momento. No tienes que planificar cada minuto.</Text></Card>}
    {query.data?.map(plan => <Card key={plan.id} className="mt-3"><Text className="text-brand-300 text-xs">{plan.hora}{plan.recordatorioId ? " · Recordatorio programado" : ""}</Text>
      <Text className={`text-white text-lg font-semibold mt-2 ${plan.realizado ? "line-through opacity-60" : ""}`}>{plan.texto}</Text>
      <View className="gap-2 mt-3">{verHoy && <Button variant="secondary" label={plan.realizado ? "✓ Hecho · desmarcar" : "Marcar como hecho"} disabled={update.isPending} onPress={() => update.mutate({ planId: plan.id, action: "marcar" })} />}
        {!plan.realizado && <Button variant="ghost" label={plan.recordatorioId ? "Cancelar recordatorio" : "Recordármelo a esta hora"} disabled={update.isPending} onPress={() => update.mutate({ planId: plan.id, action: plan.recordatorioId ? "cancelar" : "recordar" })} />}
        <Pressable accessibilityRole="button" disabled={update.isPending} className="p-3" onPress={() => update.mutate({ planId: plan.id, action: "borrar" })}><Text className="text-ink-300 text-xs text-center">Quitar este momento</Text></Pressable></View></Card>)}
    <Card className="mt-4"><View className="gap-3"><TextInput label="Un momento para mí" value={texto} onChangeText={setTexto} maxLength={100} placeholder="Estudiar, descansar, salir…" />
      <TextInput label="Hora (24 horas)" value={hora} onChangeText={setHora} maxLength={5} placeholder="08:30" helperText="Añadirlo no activa un recordatorio. Puedes pedirlo después." />
      <Button label="Añadir al plan" loading={add.isPending} disabled={texto.trim().length < 3} onPress={() => add.mutate({ texto, hora }, { onSuccess: () => setTexto("") })} /></View></Card>
    {(query.isError || add.isError || update.isError) && <Text className="text-error text-sm mt-3">{update.error?.message ?? add.error?.message ?? "No se pudo leer el plan."}</Text>}
  </Screen>;
}
