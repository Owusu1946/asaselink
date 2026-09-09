import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpClient } from "@/components/auth/sign-up-client";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUpClient />
    </AuthShell>
  );
}
