import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
