import { requestVerificationToken } from "@/features/login/api";
import { useMutation } from "@tanstack/react-query";

export function useRequestVerificationTokenMutation(options?: {
  onSettled?: () => void;
}) {
  const { isPending, mutate } = useMutation({
    mutationFn: async ({ email }: { email: string }) =>
      await requestVerificationToken(email),
    onSettled: options?.onSettled,
  });

  return {
    isPendingVerificationToken: isPending,
    requestVerificationToken: mutate,
  };
}
