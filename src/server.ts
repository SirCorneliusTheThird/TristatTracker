import { renderErrorPage } from "./lib/error-page";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  try {
    const entry = await import("@tanstack/react-start/server-entry");
    const serverHandler = entry.default ?? entry;

    if (typeof serverHandler === "function") {
      return serverHandler(request);
    }

    if (serverHandler && typeof serverHandler.fetch === "function") {
      return serverHandler.fetch(request);
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
