import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ACCENT_MAP, labelFor } from "../../lib/VerticalContext";
import { convosApi } from "../../lib/api";

export default function ConversationsRail({
  currentId,
  refreshKey,
  onSelect,
  onNew,
  onDelete,
}) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    let live = true;
    convosApi.list().then((data) => { if (live) setItems(data); }).catch(() => {});
    return () => { live = false; };
  }, [refreshKey]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await convosApi.remove(id);
      setItems((prev) => prev.filter((c) => c.id !== id));
      onDelete?.(id);
    } catch { /* noop */ }
  };

  return (
    <motion.aside
      data-testid="sidebar"
      animate={{ width: open ? 248 : 52 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="hidden md:flex flex-col shrink-0 h-full bg-void border-r border-border overflow-hidden relative"
    >
      {/* Header row — toggle always present */}
      <div className="h-[57px] px-3 flex items-center justify-between border-b border-border shrink-0">
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[10px] uppercase tracking-[0.22em] font-mono text-tertiary px-1"
            >
              Conversations
            </motion.span>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1">
          {open && (
            <button
              onClick={() => { onNew?.(); nav("/chat"); }}
              data-testid="new-chat-btn"
              className="w-7 h-7 rounded-md bg-surface hover:bg-border border border-border flex items-center justify-center text-tertiary hover:text-primary transition-all"
              title="New chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            data-testid="rail-toggle"
            className="w-7 h-7 rounded-md hover:bg-surface flex items-center justify-center text-tertiary hover:text-primary transition-all"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            title={open ? "Collapse" : "Expand"}
          >
            {open ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto px-2 py-2"
            data-testid="conversation-list"
          >
            {items.length === 0 ? (
              <p className="px-3 py-2 text-[11px] font-mono text-tertiary">No conversations yet.</p>
            ) : (
              items.map((c) => {
                const isActive = currentId === c.id;
                const a = ACCENT_MAP[c.vertical]?.accent || "#6366F1";
                return (
                  <button
                    key={c.id}
                    data-testid={`conversation-item-${c.id}`}
                    onClick={() => onSelect?.(c.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg group transition-all relative mb-0.5 ${
                      isActive ? "bg-surface" : "hover:bg-surface/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: a }} />
                      <span
                        className={`flex-1 truncate text-xs ${
                          isActive ? "text-primary" : "text-secondary group-hover:text-primary"
                        }`}
                      >
                        {c.title}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, c.id)}
                        data-testid={`conversation-delete-${c.id}`}
                        className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-red-400 transition-opacity p-0.5"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="ml-3 mt-0.5 text-[10px] font-mono text-tertiary">
                      {labelFor(c.vertical).toLowerCase()}
                    </p>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
