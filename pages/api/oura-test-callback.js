export default async function handler(req, res) {
  const { code, state, error, error_description, iss } = req.query

  if (error) {
    return res.status(200).send(`<pre style="font-family:monospace;padding:20px">
<b>Oura returned an error during authorization:</b>
error: ${error}
description: ${error_description || "none"}
iss: ${iss || "none"}
</pre>`)
  }

  if (!code) {
    return res.status(200).send(`<pre style="font-family:monospace;padding:20px">
No code received.
Full query: ${JSON.stringify(req.query, null, 2)}
</pre>`)
  }

  const redirectUri = process.env.NEXTAUTH_URL + "/api/oura-test-callback"

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    client_id: process.env.OURA_CLIENT_ID,
    client_secret: process.env.OURA_CLIENT_SECRET,
  })

  let tokenRes, tokenData
  try {
    tokenRes = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    tokenData = await tokenRes.json()
  } catch (err) {
    return res.status(200).send(`<pre style="font-family:monospace;padding:20px">Fetch error: ${err.message}</pre>`)
  }

  const success = !!tokenData.access_token
  const statusColor = success ? "green" : "red"

  let userinfoHtml = ""
  if (success) {
    try {
      const uRes = await fetch("https://api.ouraring.com/v2/usercollection/personal_info", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const uData = await uRes.json()
      userinfoHtml = `<h3>Userinfo (${uRes.status}):</h3><pre>${JSON.stringify(uData, null, 2)}</pre>`
    } catch (e) {
      userinfoHtml = `<p>Userinfo fetch error: ${e.message}</p>`
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head><title>Oura OAuth Test Result</title>
<style>body{font-family:monospace;padding:20px;max-width:900px} pre{background:#f4f4f4;padding:15px;border-radius:4px;overflow-x:auto}</style>
</head>
<body>
<h2 style="color:${statusColor}">${success ? "✅ TOKEN EXCHANGE SUCCEEDED" : "❌ TOKEN EXCHANGE FAILED"}</h2>
<p><b>Code received (first 20 chars):</b> ${code.substring(0, 20)}...</p>
<p><b>Redirect URI used:</b> ${redirectUri}</p>
<p><b>Client ID prefix:</b> ${process.env.OURA_CLIENT_ID ? process.env.OURA_CLIENT_ID.substring(0, 8) + "..." : "NOT SET"}</p>
<p><b>Token endpoint HTTP status:</b> ${tokenRes.status}</p>
<h3>Token Response:</h3>
<pre>${JSON.stringify(tokenData, null, 2)}</pre>
${userinfoHtml}
<hr/>
<p><a href="/">Back to dashboard</a></p>
</body>
</html>`

  res.status(200).send(html)
}
