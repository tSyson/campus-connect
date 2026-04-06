import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CheckCircle, Camera, XCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function StudentAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setScanning(true);
    setResult(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text) => {
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          await processAttendance(text);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      toast({ variant: "destructive", title: "Camera error", description: "Could not access camera." });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const processAttendance = async (qrText: string) => {
    if (!user) return;
    try {
      const qrData = JSON.parse(qrText);
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) {
        setResult("error");
        setMessage("You are not registered as a student.");
        return;
      }

      // Check enrollment
      const { data: enrollment } = await supabase.from("enrollments")
        .select("id").eq("student_id", student.id).eq("course_id", qrData.course_id).single();
      if (!enrollment) {
        setResult("error");
        setMessage("You are not enrolled in this course.");
        return;
      }

      // Check session is active
      const { data: session } = await supabase.from("attendance_sessions")
        .select("*").eq("id", qrData.session_id).eq("is_active", true).single();
      if (!session) {
        setResult("error");
        setMessage("This session is no longer active.");
        return;
      }

      if (new Date(session.expires_at) < new Date()) {
        setResult("error");
        setMessage("This session has expired.");
        return;
      }

      // Submit attendance
      const { error } = await supabase.from("attendance_records").insert({
        session_id: qrData.session_id,
        student_id: student.id,
        course_id: qrData.course_id,
      });

      if (error) {
        if (error.code === "23505") {
          setResult("error");
          setMessage("You have already checked in for this session.");
        } else {
          setResult("error");
          setMessage(error.message);
        }
      } else {
        setResult("success");
        setMessage("Attendance recorded successfully!");
      }
    } catch {
      setResult("error");
      setMessage("Invalid QR code.");
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Scan Attendance</h1>
      <p className="text-muted-foreground mb-6">Scan the QR code shown by your lecturer</p>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5" /> QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="qr-reader" className="rounded-lg overflow-hidden" />

          {!scanning && !result && (
            <Button onClick={startScanner} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Open Camera & Scan
            </Button>
          )}
          {scanning && (
            <Button variant="outline" onClick={stopScanner} className="w-full">
              Stop Scanner
            </Button>
          )}
          {result === "success" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle className="h-12 w-12 text-success" />
              <p className="text-sm font-medium text-success">{message}</p>
              <Button variant="outline" onClick={() => setResult(null)} className="mt-2">Done</Button>
            </div>
          )}
          {result === "error" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm font-medium text-destructive">{message}</p>
              <Button variant="outline" onClick={() => { setResult(null); startScanner(); }} className="mt-2">Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
