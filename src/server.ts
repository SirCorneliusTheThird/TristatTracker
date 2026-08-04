import { renderErrorPage } from "./lib/error-page";

export const config = {
  runtime: "edge",
};

export default {
  async fetch(request: Request) {
    try {
      const handler = await import("@tanstack/react-start/server-entry");
      const response = await handler.fetch(request);
      return response;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
