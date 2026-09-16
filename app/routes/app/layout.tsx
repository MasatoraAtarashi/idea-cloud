import { Outlet } from "react-router";
import { AppShell } from "../../components/shell";

export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
