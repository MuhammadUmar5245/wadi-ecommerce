import "server-only";
import { AuthorizationError, assertRole, type CurrentUser } from "@/lib/auth-guard";
import type { Role } from "@/lib/constants";
import type { ActionState } from "@/lib/validation";

/**
 * Wraps an admin server action: re-checks the caller's role against the
 * database before running, and turns authorisation failures into a message.
 */
export async function guarded(min: Role, fn: (user: CurrentUser) => Promise<ActionState>): Promise<ActionState> {
  try {
    const user = await assertRole(min);
    return await fn(user);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { message: e.reason === "forbidden" ? "admin.errors.forbidden" : "auth.errors.sessionExpired" };
    }
    throw e;
  }
}
