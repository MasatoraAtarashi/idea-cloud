import { Hono } from "hono";
import type { AppEnv } from "../env";
import { errorHandler } from "../middleware/error-handler";
import { requestId } from "../middleware/request-id";
import { sessionAuth } from "../middleware/session-auth";
import { analyticsRoute } from "./routes/analytics";
import { billingRoute } from "./routes/billing";
import { ideasRoute } from "./routes/ideas";
import { inspirationsRoute } from "./routes/inspirations";
import { savedViewsRoute } from "./routes/saved-views";
import { searchRoute } from "./routes/search";
import { todosRoute } from "./routes/todos";

export const api = new Hono<AppEnv>()
  .use("*", requestId)
  .use("*", sessionAuth)
  .route("/billing", billingRoute)
  .route("/todos", todosRoute)
  .route("/ideas", ideasRoute)
  .route("/inspirations", inspirationsRoute)
  .route("/saved-views", savedViewsRoute)
  .route("/search", searchRoute)
  .route("/analytics", analyticsRoute)
  .onError(errorHandler);
