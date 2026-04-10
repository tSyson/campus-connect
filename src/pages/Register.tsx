import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, UserPlus, BookOpen, Shield } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "student" && !regNumber.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your registration number." });
      return;
    }
    setLoading(true);
    const metadata: Record<string, string> = { full_name: fullName, role };
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
    <div className="min-h-screen bg-background">
      {/* University Image */}
      <div className="w-full">
        <img
          src="/images/muni-bg.jpg"
          alt="Muni University campus"
          className="w-full h-[220px] object-cover"
        />
      </div>

      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">SAMS</h1>
            <p className="text-muted-foreground text-sm">Create your account</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Register</CardTitle>
              <CardDescription>Choose your role and create an account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Role Selection */}
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
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
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
                    <Input
                      id="regNumber"
                      placeholder="e.g. CS/2024/001"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
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
    </div>
  );
}
