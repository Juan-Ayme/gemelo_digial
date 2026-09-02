import { forwardRef, useState } from "react";
import {
  TextInput as RNTextInput,
  View,
  Text,
  type TextInputProps,
} from "react-native";

import { cn } from "@lib/cn";
import { colors } from "@theme/colors";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
  {
    label,
    error,
    helperText,
    leadingIcon,
    trailingIcon,
    className,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? "border-error"
    : focused
      ? "border-primary-container"
      : "border-outline-variant/40";

  return (
    <View className="w-full gap-1.5">
      {label ? (
        <Text
          className="text-on-surface-variant"
          style={{ fontFamily: "Inter_500Medium", fontSize: 13 }}
        >
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          "flex-row items-center gap-2 rounded-2xl border bg-surface-container/60 px-4 py-3",
          borderClass,
        )}
      >
        {leadingIcon}
        <RNTextInput
          ref={ref}
          placeholderTextColor={colors.inkPlaceholder}
          selectionColor={colors.brandCyan}
          className={cn("flex-1 text-on-surface", className as string)}
          style={{ fontFamily: "Inter_400Regular", fontSize: 15 }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {trailingIcon}
      </View>
      {error ? (
        <Text
          className="text-error"
          style={{ fontFamily: "Inter_500Medium", fontSize: 12 }}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          className="text-on-surface-variant/80"
          style={{ fontFamily: "Inter_400Regular", fontSize: 12 }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});
