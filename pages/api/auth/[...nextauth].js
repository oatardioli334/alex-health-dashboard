import NextAuth from "next-auth"

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
          // Oura requires HTTP Basic Auth for client credentials
          const credentials = Buffer.from(
            `${provider.clientId}:${provider.clientSecret}`
          ).toString("base64")

          const res = await fetch("https://api.ouraring.com/oauth/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${credentials}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: params.code,
              redirect_uri: provider.callbackUrl,
            }).toString(),
          })

          const tokens = await res.json()
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
