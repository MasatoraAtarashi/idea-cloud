import { Hono } from "hono";
import type { AppEnv } from "../env";
import { accessAuth } from "../middleware/access-auth"; // squat-auth
import { errorHandler } from "../middleware/error-handler";
import { requestId } from "../middleware/request-id";
import { ideasRoute } from "./routes/ideas";
import { inspirationsRoute } from "./routes/inspirations";
import { savedViewsRoute } from "./routes/saved-views";
import { todosRoute } from "./routes/todos";

export const api = new Hono<AppEnv>()
  .use("*", requestId)
  .use("*", accessAuth) // squat-auth
  .route("/todos", todosRoute)
  .route("/ideas", ideasRoute)
  .route("/inspirations", inspirationsRoute)
  .route("/saved-views", savedViewsRoute)
  .onError(errorHandler);
