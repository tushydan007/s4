import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="h-full flex flex-col bg-navy-950">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden pt-14">
        <Outlet />
      </main>
    </div>
  );
}
