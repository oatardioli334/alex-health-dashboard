// Diagnostic: tests Oura token endpoint with body creds vs Basic Auth
// body_creds → invalid_request = Oura rejects body credentials
// basic_auth → invalid_grant = Oura accepts Basic Auth but dummy code is wrong (GOOD)
export default async function handler(req, res) {
  const redirectUri = process.env.NEXTAUTH_URL + "/api/auth/callback/oura"
  const clientId = process.env.OURA_CLIENT_ID
  const clientSecret = process.env.OURA_CLIENT_SECRET
  const dummyCode = "diagnostic_dummy_code_12345"

  // Test 1: body credentials (current NextAuth default)
  const bodyRes = await fetch("https://api.ouraring.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: dummyCode,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })
  const bodyData = await bodyRes.json()

  // Test 2: HTTP Basic Auth (what Oura actually requires)
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const basicRes = await fetch("https://api.ouraring.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: dummyCode,
      redirect_uri: redirectUri,
    }).toString(),
  })
  const basicData = await basicRes.json()

  return res.status(200).json({
    redirectUri,
    bodyCreds: { status: bodyRes.status, error: bodyData.error, description: bodyData.error_description },
    basicAuth: { status: basicRes.status, error: basicData.error, description: basicData.error_description },
    verdict: basicRes.status === 400 && basicData.error === "invalid_grant"
      ? "✅ Basic Auth works — invalid_grant means credentials are correct, code is just dummy"
      : basicRes.status === 400 && basicData.error === "invalid_request"
      ? "❌ Both methods rejected — check client_id/secret in Vercel env vars"
      : "See raw responses above",
  })
}
