import { Text, View, type ViewProps } from "react-native";

import { cn } from "@lib/cn";

type Tone = "brand" | "mint" | "coral" | "amber" | "violet" | "neutral";

const toneClass: Record<Tone, string> = {
  brand: "bg-brand-500/15 border border-brand-400/30",
  mint: "bg-emerald-400/15 border border-emerald-400/30",
  coral: "bg-rose-400/15 border border-rose-400/30",
  amber: "bg-amber-400/15 border border-amber-400/30",
  violet: "bg-violet-400/15 border border-violet-400/30",
  neutral: "bg-white/10 border border-white/15",
};

const toneText: Record<Tone, string> = {
  brand: "text-brand-300",
  mint: "text-emerald-200",
  coral: "text-rose-200",
  amber: "text-amber-200",
  violet: "text-violet-200",
  neutral: "text-ink-100",
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
