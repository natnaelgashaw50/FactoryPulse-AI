import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export default function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <div>{user?.name}</div>
          <div className="text-[11px] text-muted">{user?.role}</div>
        </div>
        <button onClick={logout} className="text-muted hover:text-danger" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
