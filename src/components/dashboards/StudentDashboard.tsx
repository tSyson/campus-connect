import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookOpen, CheckCircle, AlertTriangle, QrCode,
  Clock, TrendingUp, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";

interface CourseAttendance {
  courseId: string;
  courseCode: string;
  courseName: string;
  attended: number;
  totalWeeks: number;
  percentage: number;
  threshold: number;
  eligible: boolean;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [courseAttendance, setCourseAttendance] = useState<CourseAttendance[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [totalAttended, setTotalAttended] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) return;
      setStudentId(student.id);

      // Enrollments with course info
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses(id, code, name, total_weeks, attendance_threshold)")
        .eq("student_id", student.id);

      if (enrollments) {
        let total = 0;
        const courseData = await Promise.all(
          enrollments.map(async (e) => {
            const course = e.courses as any;
            const { count } = await supabase
              .from("attendance_records")
              .select("id", { count: "exact", head: true })
              .eq("student_id", student.id)
              .eq("course_id", e.course_id);
            const attended = count || 0;
            total += attended;
            const percentage = Math.round((attended / course.total_weeks) * 100);
            return {
              courseId: course.id,
              courseCode: course.code,
              courseName: course.name,
              attended,
              totalWeeks: course.total_weeks,
              percentage,
              threshold: Number(course.attendance_threshold),
              eligible: percentage >= Number(course.attendance_threshold),
            };
          })
        );
        setCourseAttendance(courseData);
        setTotalAttended(total);
      }

      // Recent attendance records
      const { data: records } = await supabase
        .from("attendance_records")
        .select("*, courses(code, name), attendance_sessions:session_id(week_number, session_date)")
        .eq("student_id", student.id)
        .order("checked_in_at", { ascending: false })
        .limit(10);
      setRecentRecords(records || []);
    };
    fetchData();
  }, [user]);

  const eligibleCount = courseAttendance.filter((c) => c.eligible).length;
  const notEligibleCount = courseAttendance.filter((c) => !c.eligible && c.attended > 0).length;
  const overallPercentage = courseAttendance.length > 0
    ? Math.round(courseAttendance.reduce((a, c) => a + c.percentage, 0) / courseAttendance.length)
    : 0;

  const summaryCards = [
    { title: "Enrolled Courses", value: courseAttendance.length, icon: <BookOpen className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10" },
    { title: "Sessions Attended", value: totalAttended, icon: <CheckCircle className="h-5 w-5" />, color: "text-success", bg: "bg-success/10" },
    { title: "Overall Attendance", value: `${overallPercentage}%`, icon: <TrendingUp className="h-5 w-5" />, color: "text-info", bg: "bg-info/10" },
    {
      title: "Eligibility",
      value: notEligibleCount > 0 ? `${notEligibleCount} at risk` : "All good",
      icon: notEligibleCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />,
      color: notEligibleCount > 0 ? "text-destructive" : "text-success",
      bg: notEligibleCount > 0 ? "bg-destructive/10" : "bg-success/10",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Your attendance and course progress</p>
        </div>
        <Link to="/dashboard/attendance">
          <Button>
            <QrCode className="mr-2 h-4 w-4" /> Scan QR Code
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Attendance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Attendance Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Course Attendance
            </CardTitle>
            <CardDescription>Your attendance percentage and eligibility per course</CardDescription>
          </CardHeader>
          <CardContent>
            {courseAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseAttendance.map((c) => (
                    <TableRow key={c.courseId}>
                      <TableCell>
                        <p className="text-sm font-medium">{c.courseCode}</p>
                        <p className="text-xs text-muted-foreground">{c.courseName}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.attended} / {c.totalWeeks}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={c.percentage} className="w-20 h-2" />
                          <span className={`text-sm font-medium ${c.percentage >= c.threshold ? "text-success" : "text-destructive"}`}>
                            {c.percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          c.eligible
                            ? "bg-success/10 text-success border-success/20"
                            : c.attended === 0
                              ? "bg-muted text-muted-foreground"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                        }>
                          {c.eligible ? "Eligible" : c.attended === 0 ? "No data" : "At Risk"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No enrolled courses</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" /> Recent Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length > 0 ? (
              <div className="space-y-3">
                {recentRecords.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50">
                    <div className="p-1.5 rounded-full bg-success/10">
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {(r.courses as any)?.code} — {(r.courses as any)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Wk {(r.attendance_sessions as any)?.week_number} · {new Date(r.checked_in_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 gap-3 text-muted-foreground">
                <QrCode className="h-10 w-10 opacity-40" />
                <p className="text-sm">No check-ins yet</p>
                <Link to="/dashboard/attendance">
                  <Button variant="outline" size="sm">Scan QR Code</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
