# Deployment Guide

## 1. Environment Variables
Set these variables in your Vercel Project Settings.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJ...` |
| `NEXT_PUBLIC_BASE_URL` | Your production domain (no trailing slash) | `https://mogimeet.vercel.app` |
| `CRON_SECRET` | Secret key for securing Cron API | `long_random_string` |

## 2. Vercel Deployment
1.  Push your code to GitHub.
2.  Import the repository in Vercel.
3.  Add the environment variables above.
4.  Deploy!

## 3. Database Setup
Ensure you have run the schema SQL in Supabase.
Check `docs/schema.sql` for the latest definition.

## 4. Cron Job Setup (cron-job.org)
To enable automated reminders, set up an external cron job.

1.  **URL:** `https://<YOUR_DOMAIN>/api/cron/remind`
2.  **Execution Interval:** Every 10 minutes (or 30 mins)
3.  **Method:** GET
4.  **Headers:**
    *   Key: `Authorization`
    *   Value: `Bearer <YOUR_CRON_SECRET>`

## 5. Discord Webhook
Administrators can set their own Discord Webhook URL in the event settings panel.
MogiMeet will send notifications for:
- Event Finalized
- Event Updated
- Reminders (via Cron)
