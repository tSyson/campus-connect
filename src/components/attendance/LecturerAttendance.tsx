import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Clock, Users, StopCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function LecturerAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [weekNumber, setWeekNumber] = useState("1");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [checkedIn, setCheckedIn] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("courses").select("*").eq("lecturer_id", user.id).then(({ data }) => setCourses(data || []));
    // Check for active session
    supabase.from("attendance_sessions").select("*, courses(name, code)")
      .eq("lecturer_id", user.id).eq("is_active", true).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setActiveSession(data);
          setSelectedCourse(data.course_id);
          fetchCheckedIn(data.id);
        }
      });
  }, [user]);

  const fetchCheckedIn = async (sessionId: string) => {
    const { data } = await supabase
      .from("attendance_records")
      .select("*, students(registration_number, profiles:user_id(full_name))")
      .eq("session_id", sessionId)
      .order("checked_in_at", { ascending: true });
    setCheckedIn(data || []);
  };

  useEffect(() => {
    if (!activeSession) return;
    const channel = supabase.channel("attendance-live")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "attendance_records",
        filter: `session_id=eq.${activeSession.id}`,
      }, () => fetchCheckedIn(activeSession.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeSession]);

  const startSession = async () => {
    if (!selectedCourse || !user) return;
    setLoading(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { data, error } = await supabase.from("attendance_sessions").insert({
      course_id: selectedCourse,
      lecturer_id: user.id,
      week_number: parseInt(weekNumber),
      qr_token: token,
      expires_at: expiresAt,
    }).select("*, courses(name, code)").single();
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setActiveSession(data);
      toast({ title: "Session started", description: "QR code is ready for students to scan." });
    }
  };

  const stopSession = async () => {
    if (!activeSession) return;
    await supabase.from("attendance_sessions").update({ is_active: false }).eq("id", activeSession.id);
    setActiveSession(null);
    setCheckedIn([]);
    toast({ title: "Session ended" });
  };

  const qrData = activeSession ? JSON.stringify({
    token: activeSession.qr_token,
    course_id: activeSession.course_id,
    session_id: activeSession.id,
    lecturer_id: activeSession.lecturer_id,
    ts: activeSession.created_at,
  }) : "";

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Attendance Session</h1>
      <p className="text-muted-foreground mb-6">Generate QR codes and monitor live attendance</p>

      {!activeSession ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Start New Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Week Number</Label>
              <Input type="number" min="1" max="15" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} />
            </div>
            <Button onClick={startSession} disabled={!selectedCourse || loading} className="w-full">
              <QrCode className="mr-2 h-4 w-4" />
              {loading ? "Starting..." : "Start Session"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {(activeSession.courses as any)?.code} - {(activeSession.courses as any)?.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Week {activeSession.week_number} · {activeSession.session_date}</p>
              </div>
              <Badge className="bg-success text-success-foreground">Live</Badge>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="p-4 bg-card rounded-xl border">
                <QRCodeSVG value={qrData} size={240} level="H" />
              </div>
              <p className="text-xs text-muted-foreground">Students scan this QR code to check in</p>
              <Button variant="destructive" onClick={stopSession} className="w-full">
                <StopCircle className="mr-2 h-4 w-4" /> End Session
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Live Check-ins
              </CardTitle>
              <Badge variant="outline">{checkedIn.length} students</Badge>
            </CardHeader>
            <CardContent>
              {checkedIn.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Waiting for students to check in...</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {checkedIn.map((record, i) => (
                    <div key={record.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(record.students as any)?.profiles?.full_name || "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">{(record.students as any)?.registration_number}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(record.checked_in_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
