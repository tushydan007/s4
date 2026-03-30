import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <Header />
      <main className="flex-1 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
