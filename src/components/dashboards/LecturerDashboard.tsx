import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, QrCode, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: c } = await supabase.from("courses").select("*").eq("lecturer_id", user.id);
      setCourses(c || []);
      const { count } = await supabase.from("attendance_sessions")
        .select("id", { count: "exact", head: true })
        .eq("lecturer_id", user.id)
        .eq("is_active", true);
      setActiveSessions(count || 0);
    };
    fetchData();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Lecturer Dashboard</h1>
      <p className="text-muted-foreground mb-6">Manage your courses and attendance</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Courses</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{courses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
            <QrCode className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{activeSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Action</CardTitle>
            <Clock className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/attendance">
              <Button size="sm" className="w-full">Start Attendance</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      {courses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">My Courses</h2>
          <div className="grid gap-3">
            {courses.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.code} · {c.semester}</p>
                  </div>
                  <Link to="/dashboard/attendance">
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-1" /> Start Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
