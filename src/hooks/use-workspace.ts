import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspace } from "@/lib/tristat.functions";

function describeWorkspaceError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  return error;
}

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: async () => {
      try {
        return await getWorkspace();
      } catch (error) {
        console.error("[workspace] fetch failed", describeWorkspaceError(error));
        throw error;
      }
    },
    staleTime: 30_000,
  });
}

export function useRefreshWorkspace() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["workspace"] });
}

export type Workspace = NonNullable<ReturnType<typeof useWorkspace>["data"]>;
