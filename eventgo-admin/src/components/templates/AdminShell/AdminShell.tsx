
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/organisms/AdminSidebar/AdminSidebar";
import { AdminTopbar } from "@/components/organisms/AdminTopbar/AdminTopbar";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({
  children,
}: AdminShellProps) {
  return (
    <div className="admin-shell flex min-h-screen w-full bg-[#F5F7FA]">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />

        <main className="admin-content min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
