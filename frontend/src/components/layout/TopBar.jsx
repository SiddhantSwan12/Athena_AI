import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileSearch, LogOut, MessageSquare, Upload, Library, Sun, Moon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useVertical } from "../../lib/VerticalContext";
import { useTheme } from "../../lib/ThemeContext";
import VerticalSwitcher from "../vertical/VerticalSwitcher";
import { OwlIcon } from "../Icons";

export default function TopBar({ onClear, showSwitcher = true, rightSlot }) {
  const { user, logout } = useAuth();
  const { accent } = useVertical();
  const { theme, toggle: toggleTheme } = useTheme();
  const nav = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      isActive ? "text-primary bg-surface" : "text-tertiary hover:text-secondary"
    }`;

  return (
    <header className="border-b border-border px-5 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-void/70 backdrop-blur-sm relative z-20">
      <div className="flex items-center gap-5">
        <Link to="/" className="flex items-center gap-2 group" data-testid="brand-link">
          <span className="text-primary group-hover:opacity-80 transition-opacity" style={{ color: "var(--accent, #6B5BFF)" }}>
            <OwlIcon size={18} />
          </span>
          <span className="wordmark text-base text-primary tracking-tight">Athena</span>
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accent }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </Link>

        {user && (
          <nav className="hidden sm:flex items-center gap-0.5">
            <NavLink to="/chat" className={linkClass} data-testid="nav-chat">
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </NavLink>
            <NavLink to="/library" className={linkClass} data-testid="nav-library">
              <Library className="w-3.5 h-3.5" />
              Documents
            </NavLink>
            <NavLink to="/upload" className={linkClass} data-testid="nav-upload">
              <Upload className="w-3.5 h-3.5" />
              Upload
            </NavLink>
            <NavLink
              to="/investigations"
              className={linkClass}
              data-testid="nav-investigations"
            >
              <FileSearch className="w-3.5 h-3.5" />
              Reports
            </NavLink>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSwitcher && <VerticalSwitcher />}
        {rightSlot}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center justify-center w-7 h-7 rounded-lg border border-border text-tertiary hover:text-secondary hover:border-muted transition-colors bg-surface overflow-hidden"
        >
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </motion.span>
        </button>
        {onClear && (
          <button
            onClick={onClear}
            data-testid="topbar-clear-btn"
            className="text-tertiary hover:text-secondary text-[11px] font-mono transition-colors"
          >
            clear
          </button>
        )}
        {user ? (
          <button
            onClick={() => { logout(); nav("/login"); }}
            data-testid="logout-btn"
            title={`Sign out (${user.email})`}
            className="flex items-center gap-1.5 text-tertiary hover:text-secondary text-[11px] font-mono transition-colors"
          >
            <span className="hidden md:inline">{user.name}</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            to="/login"
            data-testid="topbar-login-btn"
            className="text-secondary hover:text-primary text-xs font-medium transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
