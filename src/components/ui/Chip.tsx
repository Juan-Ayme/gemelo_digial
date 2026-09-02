import { Text, View, type ViewProps } from "react-native";

import { cn } from "@lib/cn";

type Tone = "brand" | "mint" | "coral" | "amber" | "violet" | "neutral";

const toneClass: Record<Tone, string> = {
  brand: "bg-brand-100 dark:bg-brand-900/40",
  mint: "bg-emerald-100 dark:bg-emerald-900/40",
  coral: "bg-rose-100 dark:bg-rose-900/40",
  amber: "bg-amber-100 dark:bg-amber-900/40",
  violet: "bg-violet-100 dark:bg-violet-900/40",
  neutral: "bg-ink-100 dark:bg-ink-800",
};

const toneText: Record<Tone, string> = {
  brand: "text-brand-700 dark:text-brand-200",
  mint: "text-emerald-700 dark:text-emerald-200",
  coral: "text-rose-700 dark:text-rose-200",
  amber: "text-amber-700 dark:text-amber-200",
  violet: "text-violet-700 dark:text-violet-200",
  neutral: "text-ink-700 dark:text-ink-100",
};

type Props = ViewProps & {
  label: string;
  tone?: Tone;
  leadingIcon?: React.ReactNode;
};

export function Chip({ label, tone = "brand", leadingIcon, className, ...rest }: Props) {
  return (
    <View
      className={cn(
        "self-start flex-row items-center gap-1.5 rounded-full px-3 py-1",
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {leadingIcon}
      <Text className={cn("text-xs font-semibold uppercase tracking-wide", toneText[tone])}>
        {label}
      </Text>
    </View>
  );
}
