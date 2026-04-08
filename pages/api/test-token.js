// Diagnostic endpoint — tests Oura token exchange with a dummy code
// Visit /api/test-token to see what error Oura returns for wrong credentials vs. wrong code
export default async function handler(req, res) {
  const redirectUri = process.env.NEXTAUTH_URL + "/api/auth/callback/oura"
  
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: "diagnostic_dummy_code_12345",
    redirect_uri: redirectUri,
    client_id: process.env.OURA_CLIENT_ID,
    client_secret: process.env.OURA_CLIENT_SECRET,
  })

  let ouraResponse, ouraData
  try {
    ouraResponse = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    ouraData = await ouraResponse.json()
  } catch (e) {
    return res.status(500).json({ fetchError: e.message })
  }

  return res.status(200).json({
    ouraStatus: ouraResponse.status,
    ouraResponse: ouraData,
    redirectUri,
    clientIdSet: !!process.env.OURA_CLIENT_ID,
    clientSecretSet: !!process.env.OURA_CLIENT_SECRET,
  })
}
