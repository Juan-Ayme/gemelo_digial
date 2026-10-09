import { useState } from "react";
import { Text, View } from "react-native";
import { PageHeader } from "@components/ui/PageHeader";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { TextInput } from "@components/ui/TextInput";
import { useCambioPersonal } from "@hooks/usePlanPersonal";
import { fechaLocal } from "@services/metricas";

export default function MiCambio() {
  const { query, save, mark } = useCambioPersonal(); const [texto, setTexto] = useState(""); const [editar, setEditar] = useState(false);
  const cambio = query.data; const hoy = fechaLocal(new Date()); const realizado = cambio?.realizados.includes(hoy);
  return <Screen scroll>
    <PageHeader title="Mi pequeño cambio" subtitle="Algo posible, elegido por ti." />
    {query.isLoading && <Text className="text-ink-300 mt-4">Cargando tu elección…</Text>}
    {cambio && !editar ? <Card hero className="mt-5"><Text className="text-brand-300 text-xs">MI COMPROMISO</Text><Text className="text-white text-2xl font-bold mt-3">{cambio.texto}</Text>
      <Text className="text-ink-300 text-sm mt-3">Lo marcaste en {cambio.realizados.length} {cambio.realizados.length === 1 ? "día" : "días"}. Este registro es tu propia confirmación.</Text>
      <View className="mt-4 gap-3"><Button label={realizado ? "✓ Lo hice hoy · desmarcar" : "Hoy di este pequeño paso"} loading={mark.isPending} onPress={() => mark.mutate()} />
        <Button variant="ghost" label="Elegir otro pequeño cambio" onPress={() => { setEditar(true); setTexto(""); }} /></View></Card> : <Card className="mt-5">
      <Text className="text-white font-semibold text-lg">¿Qué quieres intentar?</Text><Text className="text-ink-300 text-sm mt-2">Por ejemplo: una pausa entre tareas, caminar un rato o preparar mi mochila.</Text>
      <View className="gap-2 mt-3">{["Hacer una pausa entre tareas", "Caminar un rato a mi ritmo", "Preparar lo necesario para mañana"].map(t => <Button key={t} variant="secondary" label={t} onPress={() => setTexto(t)} />)}</View>
      <View className="mt-4"><TextInput label="Mi propio cambio" value={texto} onChangeText={setTexto} maxLength={100} placeholder="Algo pequeño que sí puedo intentar" /></View>
      <View className="mt-3"><Button label="Guardar mi elección" loading={save.isPending} disabled={texto.trim().length < 3} onPress={() => save.mutate(texto, { onSuccess: () => setEditar(false) })} /></View>
      {cambio && <Button variant="ghost" label="Conservar el actual" onPress={() => setEditar(false)} />}
    </Card>}
    {(save.isError || mark.isError || query.isError) && <Text className="text-error text-sm mt-3">No pudimos guardar o leer tu cambio. Intenta nuevamente.</Text>}
    <Card className="mt-4"><Text className="text-white font-semibold">A tu ritmo</Text><Text className="text-ink-300 text-sm mt-2">Puedes cambiar de idea. Si un día no lo haces, retómalo cuando te venga bien. Se guarda en este dispositivo para tu cuenta.</Text></Card>
  </Screen>;
}
