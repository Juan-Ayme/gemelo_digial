import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import { fetchProfile, updateAlias } from "@services/profile";

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const alias = useAuthStore((s) => s.user?.user_metadata?.alias as string | undefined);

  return useQuery({
    queryKey: userId ? qk.profile(userId) : ["profile", "anon"],
    enabled: !!userId,
    queryFn: () => fetchProfile(userId!, { alias }),
  });
}

export function useUpdateAlias() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: (alias: string) => updateAlias(userId!, alias),
    onSuccess: (profile) => {
      if (userId) qc.setQueryData(qk.profile(userId), profile);
    },
  });
}
