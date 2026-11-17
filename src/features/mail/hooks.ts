import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { mailApi } from "@/api/mail";
import type { FlagName } from "@/types/mail";

export function refreshMail(qc: QueryClient) {
  for (const key of ["messages", "search", "message", "folders"]) {
    void qc.invalidateQueries({ queryKey: [key] });
  }
}

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

export function useSearch(q: string, page: number) {
  return useQuery({
    queryKey: ["search", q, page],
    queryFn: () => mailApi.search(q, "all", page),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });
}

// Opening a message also marks it as read; lists and folder counts refresh afterwards.
export function useMessage(folder: string, uid: number, images: boolean) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["message", folder, uid, images],
    queryFn: async () => {
      const msg = await mailApi.message(folder, uid, {
        images,
        markSeen: true,
      });
      for (const key of ["messages", "search", "folders"])
        void qc.invalidateQueries({ queryKey: [key] });
      return msg;
    },
    staleTime: 60_000,
  });
}

export function useSetFlags(defaultFolder: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      uid?: number;
      uids?: number[];
      folder?: string;
      add?: FlagName[];
      remove?: FlagName[];
    }) =>
      mailApi.setFlags(
        v.folder ?? defaultFolder,
        v.uids ?? (v.uid !== undefined ? [v.uid] : []),
        v.add ?? [],
        v.remove ?? [],
      ),
    onSuccess: () => refreshMail(qc),
  });
}
