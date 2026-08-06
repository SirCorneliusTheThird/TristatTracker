import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — TriStat Tracker" },
      { name: "description", content: "Sign in or create your TriStat Tracker account to link Steam and Epic." },
      { property: "og:title", content: "Sign in — TriStat Tracker" },
      { property: "og:description", content: "Access your combined Steam and Epic gaming dashboard." },
    ],
  }),
  component: AuthPage,
});

const APP_ORIGIN = import.meta.env.VITE_APP_URL || "";

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function handleRedirect() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      if (!hash.includes("access_token") && !hash.includes("type")) return;

      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      if (error) {
        console.error("Supabase redirect callback error:", error.message);
        return;
      }
      if (data.session) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        navigate({ to: "/dashboard", replace: true });
      }
    }

    handleRedirect();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn() {
    const emailAddress = email.trim();
    if (!emailAddress || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailAddress, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp() {
    const emailAddress = email.trim();
    if (!emailAddress || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setBusy(true);
    const redirectTo = APP_ORIGIN ? `${APP_ORIGIN}/auth` : `${window.location.origin}/auth`;
    const { data, error } = await supabase.auth.signUp({
      email: emailAddress,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      toast.success("Account created and signed in successfully.");
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    toast.success("Account created. Check your email to confirm your account.");
  }

  async function google() {
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);

    if (error) {
      toast.error(error.message || "Google sign-in failed.");
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
            T
          </div>
          <h1 className="mt-4 text-xl font-semibold">TriStat Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Steam + Epic stats, goals and friends.</p>
        </div>

        <div className="surface p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <TabsContent value="signin" className="m-0">
                <Button className="w-full" onClick={signIn} disabled={busy}>
                  Sign in
                </Button>
              </TabsContent>
              <TabsContent value="signup" className="m-0">
                <Button className="w-full" onClick={signUp} disabled={busy}>
                  Create account
                </Button>
              </TabsContent>
            </div>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="secondary" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
