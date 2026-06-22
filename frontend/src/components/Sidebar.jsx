import { NavLink, useNavigate } from "react-router-dom";
import { MessageSquare, Upload, LogOut, Plus, Library } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { useAuth } from "../hooks/useAuth";
import { convosApi } from "../lib/api";
import { accentClassFor, labelFor } from "../lib/verticals";

export default function Sidebar({ onNewChat, currentConversationId, onSelectConversation, refreshKey }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    convosApi.list().then(setConversations).catch(() => setConversations([]));
  }, [refreshKey]);

  const linkClass = ({ isActive }) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
      isActive
        ? "bg-white/10 text-white"
        : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
    );

  return (
    <aside
      data-testid="sidebar"
      className="hidden md:flex flex-col w-64 shrink-0 h-screen bg-black/30 border-r border-white/[0.06]"
    >
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🦉</span>
          <div>
            <p className="font-heading font-semibold text-white text-lg tracking-tight">Athena.ai</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">RAG · Multi-domain</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 space-y-1">
        <button
          data-testid="new-chat-btn"
          onClick={() => {
            onNewChat?.();
            nav("/chat");
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-white text-sm font-medium transition-all border border-white/10 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <NavLink to="/chat" className={linkClass} data-testid="nav-chat">
          <MessageSquare className="w-4 h-4" /> Chat
        </NavLink>
        <NavLink to="/library" className={linkClass} data-testid="nav-library">
          <Library className="w-4 h-4" /> Documents
        </NavLink>
        <NavLink to="/upload" className={linkClass} data-testid="nav-upload">
          <Upload className="w-4 h-4" /> Upload
        </NavLink>
      </div>

      <div className="px-3 pt-2 pb-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
        Recent
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5" data-testid="conversation-list">
        {conversations.length === 0 ? (
          <p className="text-xs text-slate-600 px-3 py-2">No conversations yet</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              data-testid={`conversation-item-${c.id}`}
              onClick={() => onSelectConversation?.(c.id)}
              className={cn(
                accentClassFor(c.vertical),
                "w-full text-left px-3 py-2 rounded-lg group transition-all",
                currentConversationId === c.id
                  ? "bg-white/[0.06] text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              )}
              title={c.title}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs flex-1">{c.title}</span>
                <span className="text-[9px] uppercase tracking-wider text-accent shrink-0 font-semibold">
                  {labelFor(c.vertical)?.[0]}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-white/[0.06] px-3 py-3" data-testid="sidebar-user">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-athena/40 to-finance/30 flex items-center justify-center text-sm font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate font-medium">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            data-testid="logout-btn"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
