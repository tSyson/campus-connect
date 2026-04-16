import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import LecturerAttendance from "@/components/attendance/LecturerAttendance";
import StudentAttendance from "@/components/attendance/StudentAttendance";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AttendancePage() {
  const { roles } = useAuth();
  const navigate = useNavigate();
  const isStudent = roles.includes("student") && !roles.includes("admin") && !roles.includes("lecturer");

  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      {isStudent ? <StudentAttendance /> : <LecturerAttendance />}
    </DashboardLayout>
  );
}
