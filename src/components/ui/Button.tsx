import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

import { cn } from "@lib/cn";
import { colors } from "@theme/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
  labelClassName?: string;
};

const containerVariant: Record<Variant, string> = {
  primary: "bg-brand-500 active:bg-brand-600 shadow-lg shadow-brand-500/40",
  secondary: "bg-white/10 border border-white/15",
  ghost: "bg-transparent border border-white/15",
  danger: "bg-rose-500 active:bg-rose-600",
};

const textVariant: Record<Variant, string> = {
  primary: "text-ink-950",
  secondary: "text-white",
  ghost: "text-brand-300",
  danger: "text-white",
};

const sizeContainer: Record<Size, string> = {
  sm: "px-3 py-2 rounded-xl",
  md: "px-4 py-3 rounded-2xl",
  lg: "px-5 py-4 rounded-3xl",
};

const sizeText: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  fullWidth = true,
  haptic = true,
  onPress,
  className,
  labelClassName,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={async (event) => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(event);
      }}
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center gap-2",
        containerVariant[variant],
        sizeContainer[size],
        fullWidth ? "w-full" : "self-start",
        isDisabled ? "opacity-60" : "",
        className as string,
      )}
      {...rest}
    >
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 200 }}
        className="flex-row items-center gap-2"
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === "primary" ? "#0b1020" : colors.brandCyan} />
        ) : (
          leadingIcon
        )}
        <Text
          className={cn(
            "font-semibold",
            textVariant[variant],
            sizeText[size],
            labelClassName,
          )}
          style={{ fontFamily: "Inter_600SemiBold" }}
        >
          {label}
        </Text>
        {!loading && trailingIcon}
      </MotiView>
    </Pressable>
  );
}
