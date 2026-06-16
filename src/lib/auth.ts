import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

const AUTH_COOKIE = "educast_user_id";

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE)?.value;
  const userId = Number(raw);

  if (!raw || !Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export { AUTH_COOKIE };
