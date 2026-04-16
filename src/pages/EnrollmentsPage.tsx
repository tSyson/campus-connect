import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, UserPlus, ArrowLeft } from "lucide-react";

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEnrollments = async () => {
    const { data } = await supabase
      .from("enrollments")
      .select("*, courses(code, name), students(registration_number, profiles:user_id(full_name, email))")
      .order("enrolled_at", { ascending: false });
    setEnrollments(data || []);
  };

  useEffect(() => {
    fetchEnrollments();
    supabase.from("courses").select("id, code, name").order("code").then(({ data }) => setCourses(data || []));
    supabase.from("students").select("id, registration_number, profiles:user_id(full_name, email)").order("registration_number").then(({ data }) => setStudents(data || []));
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedStudent) {
      toast({ variant: "destructive", title: "Required", description: "Select both a course and a student." });
      return;
    }
    // Check duplicate
    const existing = enrollments.find(
      (en) => en.course_id === selectedCourse && en.student_id === selectedStudent
    );
    if (existing) {
      toast({ variant: "destructive", title: "Already enrolled", description: "This student is already enrolled in this course." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("enrollments").insert({
      course_id: selectedCourse,
      student_id: selectedStudent,
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Student enrolled successfully" });
      setOpen(false);
      setSelectedCourse("");
      setSelectedStudent("");
      fetchEnrollments();
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("enrollments").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Enrollment removed" });
      fetchEnrollments();
    }
  };

  const filtered = enrollments.filter((en) => {
    const q = search.toLowerCase();
    const name = (en.students as any)?.profiles?.full_name?.toLowerCase() || "";
    const reg = (en.students as any)?.registration_number?.toLowerCase() || "";
    const courseCode = (en.courses as any)?.code?.toLowerCase() || "";
    const matchesSearch = name.includes(q) || reg.includes(q) || courseCode.includes(q);
    const matchesCourse = !filterCourse || en.course_id === filterCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enrollments</h1>
          <p className="text-muted-foreground">Enroll students in course units</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" /> Enroll Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enroll Student in Course</DialogTitle></DialogHeader>
            <form onSubmit={handleEnroll} className="space-y-4">
              <div className="space-y-2">
                <Label>Course Unit</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.registration_number} — {(s.profiles as any)?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enrolling..." : "Enroll Student"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, reg number, or course..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All courses</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Enrolled On</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((en) => (
                <TableRow key={en.id}>
                  <TableCell className="font-medium">{(en.students as any)?.profiles?.full_name}</TableCell>
                  <TableCell className="font-mono text-sm">{(en.students as any)?.registration_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{(en.courses as any)?.code}</Badge>
                    <span className="ml-2 text-sm text-muted-foreground">{(en.courses as any)?.name}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(en.enrolled_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(en.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No enrollments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
