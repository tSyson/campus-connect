import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, BookOpen, ClipboardList, GraduationCap,
  AlertTriangle, TrendingUp, Clock, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, sessions: 0, departments: 0 });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [courseAttendance, setCourseAttendance] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      // Stats
      const [s, c, sess, d] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("attendance_sessions").select("id", { count: "exact", head: true }),
        supabase.from("departments").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        students: s.count || 0,
        courses: c.count || 0,
        sessions: sess.count || 0,
        departments: d.count || 0,
      });

      // Recent sessions
      const { data: sessions } = await supabase
        .from("attendance_sessions")
        .select("*, courses(name, code)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentSessions(sessions || []);

      // Department distribution
      const { data: depts } = await supabase.from("departments").select("id, name");
      if (depts && depts.length > 0) {
        const deptCounts = await Promise.all(
          depts.map(async (dept) => {
            const { count } = await supabase
              .from("students")
              .select("id", { count: "exact", head: true })
              .eq("department_id", dept.id);
            return { name: dept.name, students: count || 0 };
          })
        );
        setDepartmentData(deptCounts.filter((d) => d.students > 0));
      }

      // Course attendance overview
      const { data: allCourses } = await supabase.from("courses").select("id, name, code, total_weeks, attendance_threshold");
      if (allCourses) {
        const courseStats = await Promise.all(
          allCourses.slice(0, 8).map(async (course) => {
            const { count: enrollCount } = await supabase
              .from("enrollments")
              .select("id", { count: "exact", head: true })
              .eq("course_id", course.id);
            const { count: recordCount } = await supabase
              .from("attendance_records")
              .select("id", { count: "exact", head: true })
              .eq("course_id", course.id);
            const avgAttendance =
              enrollCount && course.total_weeks
                ? Math.round(((recordCount || 0) / (enrollCount * course.total_weeks)) * 100)
                : 0;
            return {
              code: course.code,
              name: course.name,
              enrolled: enrollCount || 0,
              avgAttendance: Math.min(avgAttendance, 100),
              threshold: Number(course.attendance_threshold),
            };
          })
        );
        setCourseAttendance(courseStats);

        // Low attendance warnings
        const warnings: any[] = [];
        for (const course of allCourses) {
          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("student_id, students(registration_number, profiles:user_id(full_name))")
            .eq("course_id", course.id);
          if (!enrollments) continue;
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
                threshold: Number(course.attendance_threshold),
              });
            }
          }
        }
        setLowAttendance(warnings.slice(0, 10));
      }
    };
    fetchAll();
  }, []);

  const statCards = [
    { title: "Total Students", value: stats.students, icon: <Users className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10" },
    { title: "Courses", value: stats.courses, icon: <BookOpen className="h-5 w-5" />, color: "text-info", bg: "bg-info/10" },
    { title: "Total Sessions", value: stats.sessions, icon: <ClipboardList className="h-5 w-5" />, color: "text-warning", bg: "bg-warning/10" },
    { title: "Departments", value: stats.departments, icon: <GraduationCap className="h-5 w-5" />, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/dashboard/departments"><Button variant="outline" size="sm">Departments</Button></Link>
          <Link to="/dashboard/courses"><Button variant="outline" size="sm">Courses</Button></Link>
          <Link to="/dashboard/enrollments"><Button variant="outline" size="sm">Enrollments</Button></Link>
          <Link to="/dashboard/students"><Button variant="outline" size="sm">Students</Button></Link>
          <Link to="/dashboard/semesters"><Button variant="outline" size="sm">Semesters</Button></Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Course Attendance Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Course Attendance Overview
            </CardTitle>
            <CardDescription>Average attendance percentage per course</CardDescription>
          </CardHeader>
          <CardContent>
            {courseAttendance.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={courseAttendance}>
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
              <p className="text-center text-muted-foreground py-12">No course data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Department Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-info" />
              Students by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      dataKey="students"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {departmentData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No departments yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" /> Recent Sessions
              </CardTitle>
            </div>
            <Link to="/dashboard/reports">
              <Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {(s.courses as any)?.code} — {(s.courses as any)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Week {s.week_number} · {s.session_date}
                      </p>
                    </div>
                    <Badge variant={s.is_active ? "default" : "secondary"}>
                      {s.is_active ? "Active" : "Ended"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sessions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Low Attendance Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Low Attendance Alerts
            </CardTitle>
            <CardDescription>Students below attendance threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {lowAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Attendance</TableHead>
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
                        <div className="flex items-center gap-2">
                          <Progress value={w.percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium text-destructive">{w.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No low attendance alerts</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
