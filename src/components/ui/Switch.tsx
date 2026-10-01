import { Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";

import { cn } from "@lib/cn";
import { colors } from "@theme/colors";

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export function Switch({ value, onValueChange, label, description, icon, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      className={cn(
        "flex-row items-start gap-3 py-2",
        disabled ? "opacity-60" : "",
      )}
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync().catch(() => {});
        onValueChange(!value);
      }}
    >
      <MotiView
        animate={{ backgroundColor: value ? colors.brand : colors.switchOff }}
        transition={{ type: "timing", duration: 220 }}
        className="w-12 h-7 rounded-full justify-center px-1"
      >
        <MotiView
          animate={{ translateX: value ? 18 : 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          className="w-5 h-5 rounded-full bg-white shadow"
        />
      </MotiView>
      {(label || description) && (
        <View className="flex-1">
          {label ? (
            <View className="flex-row items-center gap-2">
              {icon}
              <Text className="text-base font-semibold text-white">{label}</Text>
            </View>
          ) : null}
          {description ? (
            <Text className="text-sm text-ink-300 mt-0.5">{description}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
