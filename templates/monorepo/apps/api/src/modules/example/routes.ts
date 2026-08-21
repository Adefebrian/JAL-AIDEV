// Hono router for the example module. Parses and validates the request,
// calls the service, shapes the response. No business logic lives here.
import { Hono } from "hono";
import type { ExampleService } from "./service";

export function createExampleRoutes(service: ExampleService): Hono {
  const router = new Hono();

  router.get("/", (c) => c.json(service.list()));

  router.post("/", async (c) => {
    const body = await c.req.json<{ name?: string }>().catch((): { name?: string } => ({}));
    if (!body.name || typeof body.name !== "string") {
      return c.json({ error: "name is required" }, 400);
    }
    const item = service.create(body.name);
    return c.json(item, 201);
  });

  router.get("/:id/views", async (c) => {
    const views = await service.recordView(c.req.param("id"));
    return c.json({ views });
  });

  return router;
}
