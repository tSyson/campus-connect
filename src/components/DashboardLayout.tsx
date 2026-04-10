import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, QrCode,
  ClipboardList, BarChart3, Settings, LogOut, Menu, X, CalendarDays,
  Building2, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["admin", "lecturer", "student"] },
  { label: "Students", href: "/dashboard/students", icon: <Users className="h-4 w-4" />, roles: ["admin", "lecturer"] },
  { label: "Departments", href: "/dashboard/departments", icon: <Building2 className="h-4 w-4" />, roles: ["admin"] },
  { label: "Courses", href: "/dashboard/courses", icon: <BookOpen className="h-4 w-4" />, roles: ["admin", "lecturer"] },
  { label: "Enrollments", href: "/dashboard/enrollments", icon: <UserPlus className="h-4 w-4" />, roles: ["admin"] },
  { label: "Attendance", href: "/dashboard/attendance", icon: <QrCode className="h-4 w-4" />, roles: ["admin", "lecturer", "student"] },
  { label: "Reports", href: "/dashboard/reports", icon: <BarChart3 className="h-4 w-4" />, roles: ["admin", "lecturer"] },
  { label: "Semesters", href: "/dashboard/semesters", icon: <CalendarDays className="h-4 w-4" />, roles: ["admin"] },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, roles, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = navItems.filter((item) => item.roles.some((r) => roles.includes(r as any)));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground">SAMS</h2>
            <p className="text-xs text-sidebar-foreground/60">Attendance System</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filtered.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{roles[0] || "user"}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-card border-b border-border lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
