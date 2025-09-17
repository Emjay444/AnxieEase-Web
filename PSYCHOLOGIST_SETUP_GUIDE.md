# Psychologist Account Creation - Admin Guide

## How the Process Works

When you create a psychologist account from the admin panel, here's what happens:

### 1. Account Creation
- The system creates a psychologist record in the database with `is_active: false`
- A magic link email is sent to the psychologist's email address
- The magic link redirects to: `https://anxieease.vercel.app/psychologist-setup`

### 2. Magic Link Setup
- The psychologist clicks the link in their email
- They are taken to a setup page where they can create their password
- Once they complete setup, their account is activated (`is_active: true`)

### 3. Session Management
- **IMPORTANT**: When a psychologist clicks their setup link, it may interfere with your admin session
- This happens because both use the same authentication system

## Best Practices for Admins

### To Avoid Being Logged Out:
1. **Use Private/Incognito Mode**: If you need to test the setup link yourself, open it in a private browser window
2. **Different Browser**: Use a different browser for testing psychologist setup links
3. **Mobile Device**: Test setup links on your mobile device instead of the same computer

### Session Recovery:
If you do get logged out accidentally:
1. Simply log back in with your admin credentials
2. Your admin session will be restored
3. No data is lost - the psychologist account creation was already completed

### Monitoring Setup Status:
- Psychologist accounts show as "Inactive" until they complete their setup
- Once they set their password, they become "Active"
- You can see this status in the psychologist list in your admin panel

## Troubleshooting

### If a Psychologist Can't Complete Setup:
1. **Check their email**: Make sure they received the magic link email
2. **Check spam folder**: Magic link emails sometimes go to spam
3. **Recreate the account**: If the link expired, you can create a new account (this will send a fresh magic link)

### If the Magic Link Doesn't Work:
- Links are hosted on Vercel and should work properly
- Make sure the psychologist uses the exact link from their email
- Have them try opening the link in a fresh browser tab
- If issues persist, recreate the account to generate a new magic link

### Common Setup Issues:
1. **Email not showing**: The setup page now persists the email even if the session is lost
2. **Session expired**: The system includes fallback mechanisms to recover from session issues
3. **Browser compatibility**: Modern browsers are required for the setup process

## Email Templates

The magic link email contains:
- A secure setup link that expires after a reasonable time
- Instructions for the psychologist
- Your organization's branding (if configured in Supabase)

## Security Features

- Magic links are secure and single-use
- Password requirements are enforced (minimum 8 characters)
- Sessions are properly isolated to prevent conflicts
- Accounts remain inactive until setup is completed

## Need Help?

If you encounter issues with the psychologist creation process:
1. Check this guide first
2. Try the troubleshooting steps above
3. Contact technical support with specific error messages

---
*Last updated: September 2025*