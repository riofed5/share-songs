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
7. (Optional) Get a Telegram message every time a guest requests a song:
   1. In Telegram, open a chat with **@BotFather**, send `/newbot`, and pick a
      name and a username ending in `bot`. Paste the token it gives you into
      `.env.local` as `TELEGRAM_BOT_TOKEN`.
   2. Decide which chat should get the messages and let the bot in:
      - Just you: open your new bot and press **Start**.
      - A group: add the bot as a member, then send `/hello` in the group.
      - A channel: add the bot as an administrator that may post, then post
        anything in the channel.
   3. In your browser, open
      `https://api.telegram.org/bot<your token>/getUpdates` with your token in
      place of `<your token>`. Find `"chat":{"id":` and paste the number after
      it into `.env.local` as `TELEGRAM_CHAT_ID`. For a group or channel it
      starts with a minus sign; keep it. If the page shows nothing, send
      another message in the chat and reload.

   To send the messages somewhere else later, change `TELEGRAM_CHAT_ID`. Leave
   either setting blank to send no messages.
8. (Optional) Get a daily Telegram summary of the songs requested. Every day
   at 05:00 Vietnam time, the bot posts the list of requests from 05:00 the
   day before until 05:00 that morning, to the same chat as above. It needs
   the two Telegram settings, plus `CRON_SECRET`: generate another random
   string the same way as `SESSION_SECRET` and paste it into `.env.local`.

   The summary is sent by Vercel's scheduler, so it only runs on its own once
   the app is online. To try it on your computer, start the app and run this
   in a second terminal, with your `CRON_SECRET` in place of `<secret>`:
   ```
   curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/cron/daily-summary
   ```

**Important:** `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN` and `CRON_SECRET` are secrets. Never share them, never commit `.env.local` to git, and never post it online.

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
   - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (optional; leave blank for
     no Telegram messages)
   - `CRON_SECRET` (optional; leave blank for no daily summary)
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
