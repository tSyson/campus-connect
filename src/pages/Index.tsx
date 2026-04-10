import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, QrCode, BarChart3, Shield, ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-red-700 bg-red-700">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-red-700" />
            </div>
            <span className="text-lg font-bold text-white">SAMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" className="text-white hover:bg-red-600">Sign in</Button></Link>
            <Link to="/register"><Button className="bg-white text-red-700 hover:bg-red-100">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative bg-cover bg-center bg-no-repeat py-28"
        style={{ backgroundImage: "url('/images/muni-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative container mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 animate-fade-in">
          Student Attendance<br />Made Simple
        </h1>
        <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 animate-fade-in">
          Automate attendance tracking with QR codes. Real-time monitoring, eligibility reports, and powerful admin tools — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 animate-fade-in">
          <Link to="/register">
            <Button size="lg">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <QrCode className="h-8 w-8" />, title: "QR Code Attendance", desc: "Generate unique QR codes for each session. Students scan to check in instantly." },
            { icon: <BarChart3 className="h-8 w-8" />, title: "Real-Time Reports", desc: "Monitor attendance live. Track eligibility with automatic percentage calculations." },
            { icon: <Shield className="h-8 w-8" />, title: "Secure & Role-Based", desc: "Admin, lecturer, and student roles with proper access control and data security." },
          ].map((f, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-card border border-border">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-accent text-accent-foreground mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SAMS — Student Attendance Management System</p>
      </footer>
    </div>
  );
}
