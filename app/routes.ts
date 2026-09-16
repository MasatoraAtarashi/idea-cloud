import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  layout("routes/app/layout.tsx", [
    ...prefix("app", [
      index("routes/app/board.tsx"),
      route("capture", "routes/app/capture.tsx"),
      route("ideas/:ideaId", "routes/app/idea.tsx"),
      route("merge", "routes/app/merge.tsx"),
      route("research", "routes/app/research.tsx"),
      route("team", "routes/app/team.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
