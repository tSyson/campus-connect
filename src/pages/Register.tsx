import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, BookOpen, Shield, GraduationCap } from "lucide-react";
import { Footer } from "@/components/Footer";

const roleOptions = [
  { value: "student", label: "Student", icon: <GraduationCap className="h-4 w-4" />, description: "Scan QR codes to mark attendance" },
  { value: "lecturer", label: "Lecturer", icon: <BookOpen className="h-4 w-4" />, description: "Create sessions and generate QR codes" },
  { value: "admin", label: "Administrator", icon: <Shield className="h-4 w-4" />, description: "Manage the entire system" },
];

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [regNumber, setRegNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase.from("departments").select("id, name, code").order("name");
      if (data) setDepartments(data);
    };
    fetchDepartments();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "student" && !regNumber.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your registration number." });
      return;
    }
    if (!department) {
      toast({ variant: "destructive", title: "Required", description: "Please select a department." });
      return;
    }
    setLoading(true);
    const metadata: Record<string, string> = { full_name: fullName, role, department };
    if (role === "student") metadata.registration_number = regNumber;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Registration failed", description: error.message });
    } else {
      toast({ title: "Account created", description: "Check your email to verify your account." });
      navigate("/login");
    }
  };

  const selectedRole = roleOptions.find((r) => r.value === role);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero image fills the page (except footer) */}
      <div className="relative flex-1 w-full">
        <img
          src="/images/muni-bg.jpg"
          alt="Muni University campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        {/* Back button */}
        <div className="absolute top-0 left-0 z-20 px-4 pt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        {/* Centered card over the image */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-4 py-10">
          <div className="flex flex-col items-center text-center mb-6">
            <img src="/images/muni-logo.jpeg" alt="Muni University logo" className="h-14 w-14 rounded-xl object-contain mb-3" />
            <h1 className="text-2xl font-bold text-white">SAMS</h1>
            <p className="text-white/70 text-sm">Create your account</p>
          </div>
          <div className="w-full max-w-md animate-fade-in">
            <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Register</CardTitle>
              <CardDescription>Choose your role and create an account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setRole(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                          role === opt.value
                            ? "border-red-700 bg-red-700/5 text-red-700"
                            : "border-border bg-card text-muted-foreground hover:border-red-700/30"
                        }`}
                      >
                        {opt.icon}
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedRole && (
                    <p className="text-xs text-muted-foreground text-center">{selectedRole.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>

                {role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Registration Number</Label>
                    <Input id="regNumber" placeholder="e.g. CS/2024/001" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full bg-red-700 hover:bg-red-800" disabled={loading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? "Creating account..." : `Register as ${selectedRole?.label}`}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
