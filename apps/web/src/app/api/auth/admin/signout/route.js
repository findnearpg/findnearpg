function clearCookie(key) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${key}=; Path=/; Max-Age=0; SameSite=Strict; HttpOnly${secure}`;
}

function withCookieHeaders(cookies) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  for (const cookie of cookies) {
    headers.append('Set-Cookie', cookie);
  }
  return headers;
}

export async function POST() {
  return new Response(
    JSON.stringify({
      ok: true,
    }),
    {
      headers: withCookieHeaders([
        clearCookie('findnearpg_role'),
        clearCookie('findnearpg_user_id'),
        clearCookie('findnearpg_email'),
        clearCookie('findnearpg_name'),
        clearCookie('findnearpg_admin_role'),
        clearCookie('findnearpg_admin_user_id'),
        clearCookie('findnearpg_admin_email'),
        clearCookie('findnearpg_admin_name'),
      ]),
    }
  );
}
