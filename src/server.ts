import { renderErrorPage } from "./lib/error-page";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  try {
    const entry = await import("@tanstack/react-start/server-entry");
    const serverHandler = entry.default ?? entry;

    if (typeof serverHandler === "function") {
      return (serverHandler as (input: Request) => Response | Promise<Response>)(request);
    }

    if (serverHandler && typeof (serverHandler as { fetch?: (input: Request) => Response | Promise<Response> }).fetch === "function") {
      return (serverHandler as { fetch: (input: Request) => Response | Promise<Response> }).fetch(request);
    }

    throw new Error("TanStack Start server entry did not expose a usable handler");
  } catch (error) {
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}
