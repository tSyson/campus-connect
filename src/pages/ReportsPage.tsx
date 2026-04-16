import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => setCourses(data || []));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const fetchReport = async () => {
      const { data: course } = await supabase.from("courses").select("total_weeks, attendance_threshold").eq("id", selectedCourse).single();
      const { data: enrollments } = await supabase.from("enrollments")
        .select("student_id, students(registration_number, profiles:user_id(full_name))")
        .eq("course_id", selectedCourse);
      if (!enrollments || !course) return;

      const report = await Promise.all(
        enrollments.map(async (e) => {
          const { count } = await supabase.from("attendance_records")
            .select("id", { count: "exact", head: true })
            .eq("student_id", e.student_id)
            .eq("course_id", selectedCourse);
          const attended = count || 0;
          const percentage = Math.round((attended / course.total_weeks) * 100);
          return {
            studentName: (e.students as any)?.profiles?.full_name || "Unknown",
            regNumber: (e.students as any)?.registration_number || "-",
            attended,
            totalWeeks: course.total_weeks,
            percentage,
            eligible: percentage >= Number(course.attendance_threshold),
          };
        })
      );
      setReportData(report);
    };
    fetchReport();
  }, [selectedCourse]);

  const exportCSV = () => {
    if (reportData.length === 0) return;
    const header = "Name,Reg Number,Attended,Total Weeks,Percentage,Eligible\n";
    const rows = reportData.map((r) => `${r.studentName},${r.regNumber},${r.attended},${r.totalWeeks},${r.percentage}%,${r.eligible ? "Yes" : "No"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">View attendance reports and eligibility</p>
        </div>
        {reportData.length > 0 && (
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Select Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="max-w-sm"><SelectValue placeholder="Choose a course" /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => (<SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Reg. Number</TableHead>
                  <TableHead>Attended</TableHead>
                  <TableHead>Total Weeks</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell className="font-mono text-sm">{r.regNumber}</TableCell>
                    <TableCell>{r.attended}</TableCell>
                    <TableCell>{r.totalWeeks}</TableCell>
                    <TableCell>{r.percentage}%</TableCell>
                    <TableCell>
                      <Badge className={r.eligible ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                        {r.eligible ? "Eligible" : "Not Eligible"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
