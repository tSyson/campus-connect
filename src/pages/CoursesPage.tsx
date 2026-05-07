import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ArrowLeft } from "lucide-react";

export default function CoursesPage() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isLecturer = roles.includes("lecturer");
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", code: "", departmentId: "", lecturerId: "", semester: "", academicYear: "", yearOfStudy: "1" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCourses = async () => {
    let query = supabase.from("courses")
      .select("*, departments(name), profiles:lecturer_id(full_name)");
    // Lecturers (non-admin) only see their assigned courses
    if (isLecturer && !isAdmin && user) {
      query = query.eq("lecturer_id", user.id);
    }
    const { data } = await query;
    setCourses(data || []);
  };

  useEffect(() => {
    fetchCourses();
    supabase.from("departments").select("*").then(({ data }) => setDepartments(data || []));
    // Fetch lecturers (with department from profile)
    supabase.from("user_roles").select("user_id, profiles:user_id(full_name, email, department_id)")
      .eq("role", "lecturer" as any).then(({ data }) => setLecturers(data || []));
  }, [user, isAdmin, isLecturer]);

  const eligibleLecturers = form.departmentId
    ? lecturers.filter((l) => (l.profiles as any)?.department_id === form.departmentId)
    : lecturers;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("courses").insert({
      name: form.name,
      code: form.code,
      department_id: form.departmentId || null,
      lecturer_id: form.lecturerId || null,
      semester: form.semester,
      academic_year: form.academicYear,
      year_of_study: parseInt(form.yearOfStudy) || 1,
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Course created" });
      setOpen(false);
      setForm({ name: "", code: "", departmentId: "", lecturerId: "", semester: "", academicYear: "", yearOfStudy: "1" });
      fetchCourses();
    }
  };

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    const matchesYear = filterYear === "all" || String(c.year_of_study) === filterYear;
    return matchesSearch && matchesYear;
  });

  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground">Manage courses and enrollments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Course</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Course Code</Label>
                <Input required placeholder="CS101" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v, lecturerId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Lecturer
                  {form.departmentId && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      (only lecturers in this department)
                    </span>
                  )}
                </Label>
                <Select value={form.lecturerId} onValueChange={(v) => setForm({ ...form, lecturerId: v })} disabled={!form.departmentId}>
                  <SelectTrigger><SelectValue placeholder={form.departmentId ? "Select lecturer" : "Pick a department first"} /></SelectTrigger>
                  <SelectContent>
                    {eligibleLecturers.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        No lecturers in this department yet
                      </div>
                    ) : (
                      eligibleLecturers.map((l) => (
                        <SelectItem key={l.user_id} value={l.user_id}>{(l.profiles as any)?.full_name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year of Study</Label>
                <Select value={form.yearOfStudy} onValueChange={(v) => setForm({ ...form, yearOfStudy: v })}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input placeholder="Fall 2025" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input placeholder="2025/2026" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create Course"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Lecturer</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Semester</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{(c.departments as any)?.name || "-"}</TableCell>
                  <TableCell>{(c.profiles as any)?.full_name || "-"}</TableCell>
                  <TableCell>Year {c.year_of_study || 1}</TableCell>
                  <TableCell>{c.semester || "-"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No courses found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
