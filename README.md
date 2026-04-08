# Alex Health Dashboard
 
Personal health and performance dashboard pulling live data from Oura, Intervals.icu, and Hevy.

## Setup

### 1. Environment variables
Add these to Vercel project settings under Settings → Environment Variables:

```
OURA_CLIENT_ID=acabe57c-5c71-45a8-a147-a6d5fb15e894
OURA_CLIENT_SECRET=gbWRXl-4T9EQGLx1R6ftCm2RL__1NDLBv854B-ZeXxM
NEXTAUTH_URL=https://alex-health-dashboard.vercel.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
INTERVALS_ATHLETE_ID=i522704
INTERVALS_API_KEY=3w39zmkjfsme6ddqq1aag1rds
HEVY_API_KEY=70afbebc-4e32-4595-8269-8d3e48ce812f
```

### 2. Oura redirect URI
In your Oura developer app at developer.ouraring.com, set the redirect URI to:
```
https://alex-health-dashboard.vercel.app/api/auth/callback/oura
```

### 3. Deploy
Push this repo to GitHub, import into Vercel, add environment variables, deploy.

## Data sources
- **Recovery tab**: Oura Ring (OAuth) — sleep, HRV, readiness
- **Training tab**: Intervals.icu API — CTL/ATL/TSB, activities, zones
- **Strength tab**: Hevy API — workouts, lifts, estimated 1RM
- **Rehab tab**: Manual entry — NRS pain scoring, function, session log
- **Peptides tab**: Manual entry — protocol tracking with cycle day counter
