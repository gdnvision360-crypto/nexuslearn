import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizEngine from "@/components/learning/QuizEngine";

export default async function QuizPage({ params }: { params: { quizId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-gray-900">
      <QuizEngine quizId={params.quizId} />
    </div>
  );
}
