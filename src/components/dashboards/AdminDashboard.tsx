import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, ClipboardList, GraduationCap } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, sessions: 0, departments: 0 });

  useEffect(() => {
    const fetchStats = async () => {
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
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Students", value: stats.students, icon: <Users className="h-5 w-5" />, color: "text-primary" },
    { title: "Courses", value: stats.courses, icon: <BookOpen className="h-5 w-5" />, color: "text-info" },
    { title: "Sessions Today", value: stats.sessions, icon: <ClipboardList className="h-5 w-5" />, color: "text-warning" },
    { title: "Departments", value: stats.departments, icon: <GraduationCap className="h-5 w-5" />, color: "text-success" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">System overview and management</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <span className={card.color}>{card.icon}</span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
