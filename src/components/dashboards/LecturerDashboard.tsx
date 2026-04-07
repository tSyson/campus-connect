import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookOpen, QrCode, Users, Clock, TrendingUp,
  ArrowRight, AlertTriangle, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

interface CourseStats {
  id: string;
  code: string;
  name: string;
  enrolled: number;
  totalSessions: number;
  avgAttendance: number;
  threshold: number;
}

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Courses
      const { data: courses } = await supabase.from("courses").select("*").eq("lecturer_id", user.id);
      if (!courses) return;

      // Active sessions count
      const { count: activeCount } = await supabase
        .from("attendance_sessions")
        .select("id", { count: "exact", head: true })
        .eq("lecturer_id", user.id)
        .eq("is_active", true);
      setActiveSessions(activeCount || 0);

      // Recent sessions
      const { data: sessions } = await supabase
        .from("attendance_sessions")
        .select("*, courses(name, code)")
        .eq("lecturer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentSessions(sessions || []);

      // Per-course stats
      let totalEnrolled = 0;
      const warnings: any[] = [];
      const stats = await Promise.all(
        courses.map(async (course) => {
          const { count: enrollCount } = await supabase
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);
          const { count: sessionCount } = await supabase
            .from("attendance_sessions")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);
          const { count: recordCount } = await supabase
            .from("attendance_records")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);
          const avg = enrollCount && course.total_weeks
            ? Math.round(((recordCount || 0) / (enrollCount * course.total_weeks)) * 100)
            : 0;
          totalEnrolled += enrollCount || 0;

          // Check for low-attendance students
          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("student_id, students(registration_number, profiles:user_id(full_name))")
            .eq("course_id", course.id);
          if (enrollments) {
            for (const e of enrollments) {
              const { count } = await supabase
                .from("attendance_records")
                .select("id", { count: "exact", head: true })
                .eq("student_id", e.student_id)
                .eq("course_id", course.id);
              const pct = Math.round(((count || 0) / course.total_weeks) * 100);
              if (pct < Number(course.attendance_threshold) && pct > 0) {
                warnings.push({
                  studentName: (e.students as any)?.profiles?.full_name || "Unknown",
                  regNumber: (e.students as any)?.registration_number || "-",
                  courseCode: course.code,
                  percentage: pct,
                });
              }
            }
          }

          return {
            id: course.id,
            code: course.code,
            name: course.name,
            enrolled: enrollCount || 0,
            totalSessions: sessionCount || 0,
            avgAttendance: Math.min(avg, 100),
            threshold: Number(course.attendance_threshold),
          };
        })
      );
      setCourseStats(stats);
      setTotalStudents(totalEnrolled);
      setLowAttendance(warnings.slice(0, 8));
    };
    fetchData();
  }, [user]);

  const summaryCards = [
    { title: "My Courses", value: courseStats.length, icon: <BookOpen className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10" },
    { title: "Active Sessions", value: activeSessions, icon: <QrCode className="h-5 w-5" />, color: "text-success", bg: "bg-success/10" },
    { title: "Total Students", value: totalStudents, icon: <Users className="h-5 w-5" />, color: "text-info", bg: "bg-info/10" },
    { title: "Total Sessions", value: recentSessions.length > 0 ? courseStats.reduce((a, c) => a + c.totalSessions, 0) : 0, icon: <Clock className="h-5 w-5" />, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lecturer Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and attendance</p>
        </div>
        <Link to="/dashboard/attendance">
          <Button>
            <QrCode className="mr-2 h-4 w-4" /> Start Attendance
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

      {/* Charts & Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Course Attendance Overview
            </CardTitle>
            <CardDescription>Average attendance per course</CardDescription>
          </CardHeader>
          <CardContent>
            {courseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={courseStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="code" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`${value}%`, "Avg Attendance"]}
                  />
                  <Bar dataKey="avgAttendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No course data</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" /> Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {(s.courses as any)?.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Wk {s.week_number} · {s.session_date}
                      </p>
                    </div>
                    <Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">
                      {s.is_active ? "Live" : "Ended"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sessions yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Cards & Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">My Courses</CardTitle>
              <CardDescription>Enrollment & attendance at a glance</CardDescription>
            </div>
            <Link to="/dashboard/courses">
              <Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {courseStats.length > 0 ? (
              <div className="space-y-4">
                {courseStats.map((course) => (
                  <div key={course.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{course.code} — {course.name}</p>
                        <p className="text-xs text-muted-foreground">{course.enrolled} students · {course.totalSessions} sessions</p>
                      </div>
                      <Link to="/dashboard/attendance">
                        <Button variant="outline" size="sm">
                          <QrCode className="h-3 w-3 mr-1" /> Start
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={course.avgAttendance} className="flex-1 h-2" />
                      <span className={`text-sm font-medium ${course.avgAttendance >= course.threshold ? "text-success" : "text-destructive"}`}>
                        {course.avgAttendance}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No courses assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Low Attendance Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Low Attendance Alerts
            </CardTitle>
            <CardDescription>Students below the threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {lowAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowAttendance.map((w, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <p className="text-sm font-medium">{w.studentName}</p>
                        <p className="text-xs text-muted-foreground">{w.regNumber}</p>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{w.courseCode}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-destructive">{w.percentage}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground">
                <CheckCircle className="h-8 w-8 text-success" />
                <p className="text-sm">All students meeting attendance requirements</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
