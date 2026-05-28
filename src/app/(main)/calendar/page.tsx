import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseCalendar from "@/components/learning/CourseCalendar";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  return (
    <div className="min-h-screen bg-gray-900">
      <CourseCalendar />
    </div>
  );
}
