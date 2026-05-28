import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import GamificationDashboard from "@/components/learning/GamificationDashboard";

export default async function GamificationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  return (
    <div className="min-h-screen bg-gray-900">
      <GamificationDashboard />
    </div>
  );
}
