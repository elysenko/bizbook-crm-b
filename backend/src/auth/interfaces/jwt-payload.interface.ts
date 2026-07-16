export interface JwtPayload {
  /** User id (JWT standard subject claim). */
  sub: string;
  /** User role in API casing (ADMIN | USER). Informational for clients. */
  role?: string;
  /** Display name. */
  name?: string;
  /** Legacy alias for `sub`; kept for backward compatibility with older tokens. */
  id?: string;
}
