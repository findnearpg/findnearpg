export async function POST(request) {
  return Response.json(
    {
      error: 'Direct signup is disabled. Use email OTP verification endpoints.',
      requestOtpEndpoint: '/api/auth/user/signup/request-otp',
      verifyOtpEndpoint: '/api/auth/user/signup/verify-otp',
    },
    { status: 410 }
  );
}
