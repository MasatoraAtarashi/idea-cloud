import { Hono } from "hono";
import type { AppEnv } from "../env";
import { accessAuth } from "../middleware/access-auth"; // squat-auth
import { errorHandler } from "../middleware/error-handler";
import { requestId } from "../middleware/request-id";
import { ideasRoute } from "./routes/ideas";
import { todosRoute } from "./routes/todos";

export const api = new Hono<AppEnv>()
  .use("*", requestId)
  .use("*", accessAuth) // squat-auth
  .route("/todos", todosRoute)
  .route("/ideas", ideasRoute)
  .onError(errorHandler);
