// Diagnostic: tests Oura token exchange with correct endpoint + dummy code
// ✅ = invalid_grant → correct URL + valid credentials, just dummy code rejected
// ❌ = invalid_request → still wrong URL or client credentials bad
export default async function handler(req, res) {
  const redirectUri = process.env.NEXTAUTH_URL + "/api/auth/callback/oura"
  const clientId = process.env.OURA_CLIENT_ID
  const clientSecret = process.env.OURA_CLIENT_SECRET
  const dummyCode = "diagnostic_dummy_code_12345"

  // Correct token endpoint from Oura's OIDC discovery document
  const tokenUrl = "https://moi.ouraring.com/oauth/v2/oauth-token"

  const bodyRes = await fetch(tokenUrl, {
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

  return res.status(200).json({
    tokenUrl,
    redirectUri,
    result: { status: bodyRes.status, error: bodyData.error, description: bodyData.error_description },
    verdict:
      bodyData.error === "invalid_grant"
        ? "✅ Token endpoint correct — credentials valid, dummy code rejected as expected"
        : bodyData.error === "invalid_request"
        ? "❌ Still invalid_request — redirect_uri mismatch or client credentials wrong"
        : bodyData.error === "invalid_client"
        ? "❌ invalid_client — OURA_CLIENT_ID or OURA_CLIENT_SECRET is wrong in Vercel env vars"
        : JSON.stringify(bodyData),
  })
}
