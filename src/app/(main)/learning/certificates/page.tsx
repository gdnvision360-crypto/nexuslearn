import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CertificatesClient from "./CertificatesClient";

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  return <CertificatesClient />;
}
