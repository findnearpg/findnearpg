// Custom auth is implemented via explicit /api/auth/* routes in this project.
// Keep this middleware as a no-op so the scaffolded Auth.js integration does
// not intercept /api/auth/session and log UnknownAction errors in production.
export async function auth(_c, next) {
  await next();
}
