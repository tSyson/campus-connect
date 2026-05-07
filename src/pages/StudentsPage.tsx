import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ArrowLeft, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", regNumber: "", departmentId: "", yearOfStudy: "1" });
  const [loading, setLoading] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState<any>(null);
  const [eligibleCourses, setEligibleCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [selectedCourse, setSelectedCourse] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const { toast } = useToast();

  const fetchStudents = async () => {
    const { data } = await supabase.from("students")
      .select("*, profiles:user_id(full_name, email), departments(name)");
    setStudents(data || []);
  };

  useEffect(() => {
    fetchStudents();
    supabase.from("departments").select("*").then(({ data }) => setDepartments(data || []));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Create user via supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    });
    if (authError || !authData.user) {
      toast({ variant: "destructive", title: "Error", description: authError?.message || "Failed to create user" });
      setLoading(false);
      return;
    }
    // Add student role
    await supabase.from("user_roles").insert({ user_id: authData.user.id, role: "student" as any });
    // Create student record
    const { error } = await supabase.from("students").insert({
      user_id: authData.user.id,
      registration_number: form.regNumber,
      department_id: form.departmentId || null,
      year_of_study: parseInt(form.yearOfStudy),
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Student registered" });
      setOpen(false);
      setForm({ fullName: "", email: "", password: "", regNumber: "", departmentId: "", yearOfStudy: "1" });
      fetchStudents();
    }
  };

  const filtered = students.filter((s) => {
    const name = (s.profiles as any)?.full_name?.toLowerCase() || "";
    const reg = s.registration_number?.toLowerCase() || "";
    const matchesSearch = name.includes(search.toLowerCase()) || reg.includes(search.toLowerCase());
    const matchesYear = filterYear === "all" || String(s.year_of_study) === filterYear;
    return matchesSearch && matchesYear;
  });

  const openEnroll = async (student: any) => {
    setEnrollStudent(student);
    setSelectedCourse("");
    setEnrollOpen(true);
    const [{ data: courses }, { data: existing }] = await Promise.all([
      supabase.from("courses").select("id, code, name, department_id").eq("department_id", student.department_id).order("code"),
      supabase.from("enrollments").select("course_id").eq("student_id", student.id),
    ]);
    setEligibleCourses(courses || []);
    setEnrolledCourseIds(new Set((existing || []).map((e: any) => e.course_id)));
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !enrollStudent) return;
    setEnrollLoading(true);
    const { error } = await supabase.from("enrollments").insert({
      student_id: enrollStudent.id,
      course_id: selectedCourse,
    });
    setEnrollLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Student enrolled" });
      setEnrollOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage student registrations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input required value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year of Study</Label>
                <Input type="number" min="1" max="6" value={form.yearOfStudy} onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Register Student"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{(s.profiles as any)?.full_name}</TableCell>
                  <TableCell className="font-mono text-sm">{s.registration_number}</TableCell>
                  <TableCell>{(s.profiles as any)?.email}</TableCell>
                  <TableCell>{(s.departments as any)?.name || "-"}</TableCell>
                  <TableCell>{s.year_of_study}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEnroll(s)} disabled={!s.department_id}>
                      <UserPlus className="h-3.5 w-3.5" /> Enroll
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll {(enrollStudent?.profiles as any)?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Department: <Badge variant="outline">{(enrollStudent?.departments as any)?.name || "-"}</Badge>
            </div>
            <div className="space-y-2">
              <Label>Course Unit</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {eligibleCourses.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">No courses in this department</div>
                  ) : (
                    eligibleCourses
                      .filter((c) => !enrolledCourseIds.has(c.id))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={enrollLoading || !selectedCourse}>
              {enrollLoading ? "Enrolling..." : "Enroll Student"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
