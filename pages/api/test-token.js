// Diagnostic: tests api.ouraring.com/oauth/token with UUID-shaped code
// invalid_grant = endpoint works, credentials correct (UUID code just expired/wrong)
// invalid_request = endpoint wrong OR redirect_uri mismatch OR credentials invalid
// invalid_client = credentials wrong
export default async function handler(req, res) {
  const redirectUri = process.env.NEXTAUTH_URL + "/api/auth/callback/oura"
  const clientId = process.env.OURA_CLIENT_ID
  const clientSecret = process.env.OURA_CLIENT_SECRET

  // UUID-shaped code (closer to real OAuth auth codes)
  const uuidCode = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

  const tokenRes = await fetch("https://api.ouraring.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: uuidCode,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })
  const tokenData = await tokenRes.json()

  return res.status(200).json({
    tokenUrl: "https://api.ouraring.com/oauth/token",
    redirectUri,
    clientIdPrefix: clientId ? clientId.substring(0, 8) + "..." : "NOT SET",
    result: { status: tokenRes.status, error: tokenData.error, description: tokenData.error_description },
    verdict:
      tokenData.error === "invalid_grant"
        ? "✅ Endpoint works — credentials valid, code just fake. OAuth flow should work!"
        : tokenData.error === "invalid_client"
        ? "❌ Client credentials wrong — check OURA_CLIENT_ID and OURA_CLIENT_SECRET in Vercel"
        : tokenData.error === "invalid_request"
        ? "⚠️ invalid_request — likely redirect_uri mismatch with Oura developer portal"
        : JSON.stringify(tokenData),
  })
}
