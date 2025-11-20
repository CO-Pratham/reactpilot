import { Outlet } from "react-router-dom";
import { Navbar, Sidebar } from "../../shared/components";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
