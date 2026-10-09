import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@theme/colors";

/** Panel modal con salida explícita y botón Atrás de Android; no altera datos al cerrar. */
export function BottomSheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: colors.scrim }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar panel" onPress={onClose} style={{ flex: 1 }} />
      <View accessibilityViewIsModal style={{ height: "85%", paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.sheet,
        borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.ringTrack }}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-white/10 gap-3">
          <Text accessibilityRole="header" className="text-white text-lg font-semibold flex-1">{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={`Cerrar ${title}`} className="px-3 py-3" style={{ minHeight: 44 }}>
            <Text className="text-brand-300 text-base font-semibold">Listo</Text>
          </Pressable>
        </View>
        <ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
