# Share Songs

Customers scan a QR code and request a song. You see the list at `/admin`.

## Before you start

You'll need a Supabase account (free tier works) to store the song requests, and a Vercel account (free tier works) to host the app. Create both before you begin.

## Set up the database

1. Sign in to Supabase at https://supabase.com
2. Create a new project or open an existing one
3. Go to **SQL Editor** and click **New query**
4. Open the `supabase/schema.sql` file in this folder, copy all the code, and paste it into the Supabase editor
5. Click **Run** to create the tables and set up security rules

## Fill in the settings

1. Open `.env.local` in this folder. It already exists, with every setting name and a blank space after it. (If it is missing, copy `.env.example` to `.env.local` first.)
2. Fill in each value:
   - Go to your Supabase project **Project Settings**, then **API**
   - Copy `NEXT_PUBLIC_SUPABASE_URL` and paste it into `.env.local`
   - Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and paste it into `.env.local`
   - Copy `service_role secret` and paste it as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
3. Set `ADMIN_PASSWORD` to a strong password only you know
4. Generate a `SESSION_SECRET` by running this in your computer's terminal:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste it into `.env.local` as `SESSION_SECRET`
5. (Optional) Set `GOOGLE_REVIEW_URL` to your pub's Google review link, to
   show a "Rate us on Google" button after a guest sends a song. Get it from
   Google Maps: find your pub, open **Reviews**, and copy the share link.
   Leave it blank to hide the button.
6. (Optional) Set `ADMIN_WINDOW_HOURS` to the number of hours back the admin
   page should show. The default is 12. Leave it blank to show the last 12 hours.

**Important:** `SUPABASE_SERVICE_ROLE_KEY` is a secret. Never share it, never commit `.env.local` to git, and never post it online.

## Run it on your computer

1. Install Node.js if you haven't already (https://nodejs.org/)
2. In the `share-songs` folder, run:
   ```
   npm install
   npm run dev
   ```
3. The app opens at http://localhost:3000 — customers use this to request songs
4. Go to http://localhost:3000/admin to log in and see the queue

## Put it online

This folder is its own project. There are two ways to publish it. The first is
simpler; the second redeploys automatically whenever you change the code.

**Simplest: publish straight from your computer**

1. In the `share-songs` folder, run:
   ```
   npx vercel
   ```
2. Sign in when it asks. Accept the defaults it offers.
3. When it finishes, run `npx vercel --prod` to publish the live version.
4. Open your project on https://vercel.com, go to **Settings**, then
   **Environment Variables**, and add each of these with the same values you
   put in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USER` (leave as `admin`)
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `GOOGLE_REVIEW_URL` (optional; leave blank to hide the button)
   - `ADMIN_WINDOW_HOURS` (optional; default 12)
5. Run `npx vercel --prod` once more so the new settings take effect. Do the
   same again after changing any setting later.

**Or: through GitHub, for automatic updates**

1. Create an empty repository on GitHub.
2. In the `share-songs` folder, run the commands GitHub shows you for
   "push an existing repository".
3. On https://vercel.com click **Add New**, choose **Project**, and import
   that repository.
4. Add the same environment variables listed above during the import.
5. Click **Deploy**.

Either way, Vercel gives you a live web address at the end. That address is
what the QR code should point to.

## The QR code

Make a QR code that points to your Vercel URL. You can use any free QR code generator online (search "QR code generator"). Print it out and put it somewhere customers can scan it from their phones.
