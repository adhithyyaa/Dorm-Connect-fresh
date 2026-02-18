import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, GraduationCap, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import SOSButton from "@/components/SOSButton";

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginType, setLoginType] = useState<"student" | "admin">("student");

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"student" | "admin">("student");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, role } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    if (error) {
      toast({ title: "Login Failed", description: error, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!" });
      if (role === "student") navigate("/student");
      else navigate("/admin");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(regEmail, regPassword, regUsername, regRole);
    setLoading(false);
    if (error) {
      toast({ title: "Registration Failed", description: error, variant: "destructive" });
    } else if (regRole === "admin") {
      toast({ title: "Registration Successful", description: "Admin Approval Pending. You will be able to login after the Primary Admin approves your account." });
    } else {
      toast({ title: "Registration Successful" });
      navigate("/student");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="heading-display text-2xl text-foreground">Dorm Connect</h1>
            <p className="text-sm text-muted-foreground">Hostel Room Complaint Management</p>
          </div>
        </div>
        <SOSButton />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="heading-display text-xl">Sign In</CardTitle>
                  <CardDescription>Access your Dorm Connect account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={loginType === "student" ? "default" : "outline"}
                        className="flex-1 gap-2"
                        onClick={() => setLoginType("student")}
                      >
                        <GraduationCap className="h-4 w-4" /> Student
                      </Button>
                      <Button
                        type="button"
                        variant={loginType === "admin" ? "default" : "outline"}
                        className="flex-1 gap-2"
                        onClick={() => setLoginType("admin")}
                      >
                        <UserCog className="h-4 w-4" /> Admin
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="heading-display text-xl">Register</CardTitle>
                  <CardDescription>Create a new account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={regRole === "student" ? "default" : "outline"}
                        className="flex-1 gap-2"
                        onClick={() => setRegRole("student")}
                      >
                        <GraduationCap className="h-4 w-4" /> Student
                      </Button>
                      <Button
                        type="button"
                        variant={regRole === "admin" ? "default" : "outline"}
                        className="flex-1 gap-2"
                        onClick={() => setRegRole("admin")}
                      >
                        <UserCog className="h-4 w-4" /> Admin
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input id="reg-username" value={regUsername} onChange={e => setRegUsername(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Registering..." : "Register"}
                    </Button>
                    {regRole === "admin" && (
                      <p className="text-xs text-muted-foreground text-center">
                        Admin accounts require Primary Admin approval before login.
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
