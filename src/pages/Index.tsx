import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-red-700 bg-red-700">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <img src="/images/muni-logo.jpeg" alt="Muni University logo" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-lg font-bold text-white">SAMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" className="text-white hover:bg-red-600">Sign in</Button></Link>
            <Link to="/register"><Button className="bg-white text-red-700 hover:bg-red-100">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero with text overlay */}
      <section className="relative w-full h-[500px]">
        <img
          src="/images/muni-bg.jpg"
          alt="Muni University campus"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 animate-fade-in">
            Student Attendance<br />Made Simple
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 animate-fade-in">
            Automate attendance tracking with QR codes. Real-time monitoring, eligibility reports, and powerful admin tools — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <Link to="/register">
              <Button size="lg" className="bg-red-700 hover:bg-red-800 text-white">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SAMS — Student Attendance Management System</p>
      </footer>
    </div>
  );
}
