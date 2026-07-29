"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  Clock3,
  Compass,
  Heart,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Shield,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";

type NavItem = { label: string; href: string; icon: LucideIcon; badge?: string };

const primaryNav: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: Home },
  { label: "Mi biblioteca", href: "/biblioteca", icon: BookOpen },
  { label: "Explorar", href: "/explorar", icon: Compass },
  { label: "Favoritos", href: "/favoritos", icon: Heart },
];

const activityNav: NavItem[] = [
  { label: "Historial", href: "/historial", icon: Clock3 },
  { label: "Estadísticas", href: "/estadisticas", icon: BarChart3 },
  { label: "Notificaciones", href: "/notificaciones", icon: Bell },
];

const systemNav: NavItem[] = [
  { label: "Perfil", href: "/perfil", icon: User },
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

function NavigationGroup({
  label,
  items,
  collapsed,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="nav-group">
      {!collapsed && <p className="nav-group-label">{label}</p>}
      <nav aria-label={label}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href.startsWith("/") && pathname === item.href;
          return (
            <Link
              className={cn("nav-link", isActive && "is-active")}
              href={item.href}
              key={item.label}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

type AppShellProfile = {
  displayName: string;
  email: string;
  username: string;
  avatarUrl: string | null;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AS";
}

function UserAvatar({ src, text }: { src: string | null; text: string }) {
  return (
    <span className="avatar avatar-sm avatar-jose" aria-hidden="true">
      {src ? <Image alt="" fill sizes="32px" src={src} /> : text}
    </span>
  );
}

export function AppShell({
  children,
  profile,
  canAccessAdmin,
  notificationCount,
}: {
  children: ReactNode;
  profile: AppShellProfile;
  canAccessAdmin: boolean;
  notificationCount: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const avatarText = initials(profile.displayName);
  const avatarUrl = profile.avatarUrl
    ?? (profile.username.toLocaleLowerCase() === "atreus" ? "/images/avatar-subaru-v1.png" : null);
  const visibleNotificationCount = `${Math.min(notificationCount, 99)}${notificationCount > 99 ? "+" : ""}`;
  const activityItems = activityNav.map((item) => (
    item.href === "/notificaciones" && notificationCount > 0
      ? { ...item, badge: visibleNotificationCount }
      : item
  ));

  useEffect(() => {
    if (!profileOpen) return;

    const button = profileButtonRef.current;
    const popover = profilePopoverRef.current;
    popover?.querySelector<HTMLElement>("button, a, [tabindex]:not([tabindex='-1'])")?.focus();

    const closeAndRestoreFocus = () => {
      setProfileOpen(false);
      button?.focus();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRestoreFocus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popover?.contains(target) && !button?.contains(target)) setProfileOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [profileOpen]);

  return (
    <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
      <aside className={cn("sidebar", mobileOpen && "mobile-open")}>
        <div className="sidebar-brand-row">
          <Logo compact={collapsed} />
          <button
            className="icon-button sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            type="button"
            aria-label="Cerrar menú"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-nav-scroll">
          <NavigationGroup label="Principal" items={primaryNav} collapsed={collapsed} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavigationGroup label="Actividad" items={activityItems} collapsed={collapsed} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavigationGroup label="Sistema" items={systemNav} collapsed={collapsed} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          {canAccessAdmin && (
            <div className="nav-group admin-group">
              {!collapsed && <p className="nav-group-label">Administración</p>}
              <Link className={cn("nav-link", pathname === "/admin" && "is-active")} href="/admin" title={collapsed ? "Panel administrativo" : undefined}>
                <Shield aria-hidden="true" size={18} strokeWidth={1.8} />
                {!collapsed && <span>Panel administrativo</span>}
                {!collapsed && <span className="admin-dot" aria-hidden="true" />}
              </Link>
            </div>
          )}
        </div>

        <div className="sidebar-user">
          <UserAvatar src={avatarUrl} text={avatarText} />
          {!collapsed && (
            <span className="sidebar-user-copy">
              <strong>{profile.displayName}</strong>
              <small>{profile.username ? `@${profile.username}` : "Mi perfil"}</small>
            </span>
          )}
          {!collapsed && <ChevronLeft size={15} className="user-chevron" />}
        </div>

        <button
          className="sidebar-collapse"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
        >
          <PanelLeftClose className={collapsed ? "rotate-180" : undefined} size={17} />
        </button>
      </aside>

      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" />}

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} type="button" aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="global-search">
            <Search aria-hidden="true" size={17} />
            <input aria-label="Buscar anime, personajes o estudios" placeholder="Buscar anime, personajes, estudios..." />
            <kbd>Ctrl K</kbd>
          </div>
          <div className="topbar-actions">
            <Link className="add-anime-button" href="/agregar-anime">
              <Plus aria-hidden="true" size={17} />
              <span>Agregar anime</span>
            </Link>
            <Link className="icon-button notification-button" href="/notificaciones" aria-label="Abrir notificaciones">
              <Bell size={18} />
              {notificationCount > 0 && <span className="notification-count">{visibleNotificationCount}</span>}
            </Link>
            <button
              ref={profileButtonRef}
              className="profile-button"
              type="button"
              aria-label={`Abrir menú de ${profile.displayName}`}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              onClick={() => setProfileOpen((value) => !value)}
            >
              <UserAvatar src={avatarUrl} text={avatarText} />
              <span className="profile-copy"><strong>{profile.displayName}</strong><small>{profile.username ? `@${profile.username}` : "Mi perfil"}</small></span>
              <ChevronLeft className="rotate-90" size={14} />
            </button>
            {profileOpen && (
              <div ref={profilePopoverRef} className="profile-popover" role="menu" aria-label="Menú de perfil">
                <span><strong>{profile.displayName}</strong><small>{profile.email}</small></span>
                <form action={logoutAction}><button role="menuitem" type="submit"><LogOut size={15} />Cerrar sesión</button></form>
              </div>
            )}
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
        {primaryNav.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.label} className={pathname === item.href ? "is-active" : undefined}>
              <Icon size={19} />
              <span>{item.label === "Mi biblioteca" ? "Biblioteca" : item.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setMobileOpen(true)}>
          <Menu size={19} />
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
