import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, AlertTriangle, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState(0);
  const [totalAttended, setTotalAttended] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) return;
      const { count: ec } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", student.id);
      const { count: ac } = await supabase.from("attendance_records").select("id", { count: "exact", head: true }).eq("student_id", student.id);
      setEnrollments(ec || 0);
      setTotalAttended(ac || 0);
    };
    fetchData();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Student Dashboard</h1>
      <p className="text-muted-foreground mb-6">Your attendance and courses</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Courses</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{enrollments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions Attended</CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalAttended}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scan Attendance</CardTitle>
            <QrCode className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/attendance">
              <Button size="sm" className="w-full">Scan QR Code</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
