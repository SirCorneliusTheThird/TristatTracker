import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspace } from "@/lib/tristat.functions";

function summarizeWorkspace(data: Awaited<ReturnType<typeof getWorkspace>>) {
  return {
    hasProfile: Boolean(data.profile),
    links: data.links.length,
    games: data.games.length,
    friends: data.friends.length,
    goals: data.goals.length,
    activity: data.activity.length,
    goalEvents: data.goalEvents.length,
  };
}

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
      console.groupCollapsed("[workspace] fetch");
      console.log("[workspace] step", "calling getWorkspace()");
      try {
        const data = await getWorkspace();
        console.log("[workspace] step", "getWorkspace() resolved");
        console.log("[workspace] summary", summarizeWorkspace(data));
        console.groupEnd();
        return data;
      } catch (error) {
        console.error("[workspace] fetch failed", describeWorkspaceError(error));
        console.groupEnd();
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
