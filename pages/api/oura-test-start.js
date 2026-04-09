export default function handler(req, res) {
  const state = Math.random().toString(36).substring(2, 18)
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OURA_CLIENT_ID,
    redirect_uri: process.env.NEXTAUTH_URL + "/api/oura-test-callback",
    scope: "email personal daily heartrate workout tag session spo2",
    state: state,
  })
  res.setHeader(
    "Set-Cookie",
    `oura_test_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  )
  res.redirect(302, `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`)
}
