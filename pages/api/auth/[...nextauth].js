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
      token: "https://api.ouraring.com/oauth/token",
      userinfo: "https://api.ouraring.com/v2/usercollection/personal_info",
      clientId: process.env.OURA_CLIENT_ID,
      clientSecret: process.env.OURA_CLIENT_SECRET,
      checks: ["state"],
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
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("[NEXTAUTH ERROR]", code, JSON.stringify(metadata))
    },
    warn(code) {
      console.warn("[NEXTAUTH WARN]", code)
    },
    debug(code, metadata) {
      console.log("[NEXTAUTH DEBUG]", code, JSON.stringify(metadata))
    },
  },
}

export default NextAuth(authOptions)
