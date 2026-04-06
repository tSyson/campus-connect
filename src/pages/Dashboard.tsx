import { useAuth } from "@/lib/auth";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import LecturerDashboard from "@/components/dashboards/LecturerDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const { roles } = useAuth();

  const content = roles.includes("admin")
    ? <AdminDashboard />
    : roles.includes("lecturer")
      ? <LecturerDashboard />
      : <StudentDashboard />;

  return <DashboardLayout>{content}</DashboardLayout>;
}
