import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspace } from "@/lib/tristat.functions";

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => getWorkspace(),
    staleTime: 30_000,
  });
}

export function useRefreshWorkspace() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["workspace"] });
}

export type Workspace = NonNullable<ReturnType<typeof useWorkspace>["data"]>;
