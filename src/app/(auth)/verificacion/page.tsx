import { VerificationForm } from "@/components/auth/auth-forms";

export default async function VerificationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return <VerificationForm email={email} resent={params.resent === "1"} />;
}
