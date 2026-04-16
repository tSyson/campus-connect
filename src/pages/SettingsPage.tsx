import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
      <p className="text-muted-foreground mb-6">System configuration and policies</p>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" /> Attendance Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Attendance Threshold (%)</Label>
              <Input type="number" defaultValue="75" min="0" max="100" />
            </div>
            <div className="space-y-2">
              <Label>Total Weeks per Semester</Label>
              <Input type="number" defaultValue="15" min="1" max="52" />
            </div>
            <div className="space-y-2">
              <Label>QR Code Expiry (minutes)</Label>
              <Input type="number" defaultValue="30" min="5" max="120" />
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
