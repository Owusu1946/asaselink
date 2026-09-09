import { AuthShell } from "@/components/auth/auth-shell";
import { SignInClient } from "@/components/auth/sign-in-client";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInClient />
    </AuthShell>
  );
}
