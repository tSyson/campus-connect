import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import LecturerAttendance from "@/components/attendance/LecturerAttendance";
import StudentAttendance from "@/components/attendance/StudentAttendance";

export default function AttendancePage() {
  const { roles } = useAuth();
  const isStudent = roles.includes("student") && !roles.includes("admin") && !roles.includes("lecturer");

  return (
    <DashboardLayout>
      {isStudent ? <StudentAttendance /> : <LecturerAttendance />}
    </DashboardLayout>
  );
}
