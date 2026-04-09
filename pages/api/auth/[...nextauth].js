import NextAuth from "next-auth"

const WEBHOOK_DEBUG = "https://webhook.site/db9c5af3-2a2a-4dcf-a851-056579140ded"

async function postDebug(data) {
  try {
    await fetch(WEBHOOK_DEBUG, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  } catch (e) { /* ignore */ }
}

export const authOptions = {
  providers: [
    {
      id: "oura",
      name: "Oura",
      type: "oauth",
      authorization: {
        url: "https://cloud.ouraring.com/oauth/authorize",
        params: {
          response_type: "code",
          scope: "email personal daily heartrate workout tag session spo2",
        },
      },
      token: {
        url: "https://api.ouraring.com/oauth/token",
        async request({ params, provider }) {
          const body = new URLSearchParams({
            grant_type: "authorization_code",
            code: params.code,
            redirect_uri: provider.callbackUrl,
            client_id: provider.clientId,
            client_secret: provider.clientSecret,
          })
          await postDebug({
            step: "token_request",
            code_prefix: params.code ? params.code.substring(0, 20) : "NONE",
            redirect_uri: provider.callbackUrl,
            client_id_prefix: provider.clientId ? provider.clientId.substring(0, 8) : "NONE",
            all_params: Object.keys(params),
          })
          const res = await fetch("https://api.ouraring.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
          })
          const tokens = await res.json()
          await postDebug({
            step: "token_response",
            status: res.status,
            error: tokens.error,
            error_description: tokens.error_description,
            has_access_token: !!tokens.access_token,
          })
          console.log("[OURA TOKEN]", res.status, JSON.stringify(tokens))
          if (!res.ok) throw new Error(`Token exchange failed ${res.status}: ${JSON.stringify(tokens)}`)
          return { tokens }
        },
      },
      userinfo: {
        url: "https://api.ouraring.com/v2/usercollection/personal_info",
        async request({ tokens }) {
          const res = await fetch("https://api.ouraring.com/v2/usercollection/personal_info", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          })
          const data = await res.json()
          await postDebug({ step: "userinfo_response", status: res.status, data })
          console.log("[OURA USERINFO]", res.status, JSON.stringify(data))
          if (!res.ok) throw new Error(`Oura userinfo ${res.status}: ${JSON.stringify(data)}`)
          return data
        },
      },
      clientId: process.env.OURA_CLIENT_ID,
      clientSecret: process.env.OURA_CLIENT_SECRET,
      checks: [],
      profile(profile) {
        return {
          id: profile.id || "oura_user",
          name: profile.email || "Alex",
          email: profile.email || null,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: { signIn: "/" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, metadata) { console.error("[NEXTAUTH ERROR]", code, JSON.stringify(metadata)) },
    warn(code) { console.warn("[NEXTAUTH WARN]", code) },
    debug(code, metadata) { console.log("[NEXTAUTH DEBUG]", code, JSON.stringify(metadata)) },
  },
}

export default NextAuth(authOptions)
