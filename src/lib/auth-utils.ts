import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      bio: true,
      timezone: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.status !== "ACTIVE") {
    throw new Error("Account is not active");
  }
  return user;
}

export async function requireRole(...roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return user;
}

export function handleApiError(error: unknown) {
  console.error("[API Error]", error);

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message.startsWith("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ error: "Internal server error" }, { status: 500 });
}
