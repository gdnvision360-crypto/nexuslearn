import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LearningPaths from "@/components/learning/LearningPaths";

export default async function PathsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  return (
    <div className="min-h-screen bg-gray-900">
      <LearningPaths />
    </div>
  );
}
