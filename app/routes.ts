import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  layout("routes/app/layout.tsx", [
    ...prefix("app", [
      index("routes/app/home.tsx"),
      route("list", "routes/app/board.tsx"),
      route("capture", "routes/app/capture.tsx"),
      route("ideas/:ideaId", "routes/app/idea.tsx"),
      route("merge", "routes/app/merge.tsx"),
      route("research", "routes/app/research.tsx"),
      route("search", "routes/app/search.tsx"),
      route("settings", "routes/app/settings.tsx"),
      route("analytics", "routes/app/analytics.tsx"),
      route("inspirations", "routes/app/inspirations.tsx"),
      route("inspirations/:inspirationId", "routes/app/inspiration.tsx"),
      route("team", "routes/app/team.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
