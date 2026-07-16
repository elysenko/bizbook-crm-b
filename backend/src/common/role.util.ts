import { Role } from '@generated/prisma/client';

/**
 * API role casing used by the Angular frontend and the acceptance spec
 * (`ADMIN` / `USER`). The database + guards use Prisma's lowercase enum
 * (`admin` / `user`); this maps the DB value to the public API casing.
 */
export type ApiRole = 'ADMIN' | 'USER';

export function toApiRole(role: Role | string): ApiRole {
  return String(role).toLowerCase() === 'admin' ? 'ADMIN' : 'USER';
}

/** Public shape of a user returned by auth endpoints. */
export function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  image?: string | null;
  createdAt?: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toApiRole(user.role),
    image: user.image ?? undefined,
    createdAt: user.createdAt,
  };
}
