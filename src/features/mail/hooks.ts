import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { mailApi } from "@/api/mail";
import type { FlagName } from "@/types/mail";

export function useFolders() {
  return useQuery({
    queryKey: ["folders"],
    queryFn: mailApi.folders,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMessages(folder: string, page: number) {
  return useQuery({
    queryKey: ["messages", folder, page],
    queryFn: () => mailApi.messages(folder, page),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

// Membuka surat sekaligus menandainya dibaca; daftar & hitungan folder disegarkan sesudahnya.
export function useMessage(folder: string, uid: number, images: boolean) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["message", folder, uid, images],
    queryFn: async () => {
      const msg = await mailApi.message(folder, uid, {
        images,
        markSeen: true,
      });
      void qc.invalidateQueries({ queryKey: ["messages", folder] });
      void qc.invalidateQueries({ queryKey: ["folders"] });
      return msg;
    },
    staleTime: 60_000,
  });
}

export function useSetFlags(folder: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { uid: number; add?: FlagName[]; remove?: FlagName[] }) =>
      mailApi.setFlags(folder, [v.uid], v.add ?? [], v.remove ?? []),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages", folder] });
      void qc.invalidateQueries({ queryKey: ["message", folder] });
      void qc.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}
