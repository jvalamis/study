This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

This project uses Upstash Redis for storing test data via the `@upstash/redis` SDK. You need to set up the following environment variables:

1. **For Local Development:**
   
   **Option A: Pull from Vercel (Recommended)**
   ```bash
   # Link your local project to Vercel (if not already linked)
   vercel link
   
   # Pull environment variables from Vercel
   vercel env pull .env.local
   ```
   
   **Option B: Create manually**
   Create a `.env.local` file in the root directory with:
   ```env
   UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="your-token"
   ```
   
   Note: The `@upstash/redis` SDK automatically reads from `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables, or you can use the legacy KV variables:
   ```env
   KV_REST_API_READ_ONLY_TOKEN="your-read-only-token"
   KV_REST_API_TOKEN="your-token"
   KV_REST_API_URL="https://your-database.upstash.io"
   KV_URL="rediss://default:your-token@your-database.upstash.io:6379"
   REDIS_URL="rediss://default:your-token@your-database.upstash.io:6379"
   ```

2. **For Vercel Deployment:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add the environment variables (the SDK will automatically detect them)

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Important: Environment Variables

Before deploying, make sure to add environment variables in your Vercel project settings:

1. Go to your project on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables (get them from your Upstash dashboard):
   - `UPSTASH_REDIS_REST_URL` (or `KV_REST_API_URL`)
   - `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_TOKEN`)
   
   You can also add the legacy KV variables for compatibility:
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_URL`
   - `KV_URL`
   - `REDIS_URL`

After adding the environment variables, redeploy your project for the changes to take effect.

**Note:** This project uses `@upstash/redis` SDK which automatically detects environment variables from Upstash.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
