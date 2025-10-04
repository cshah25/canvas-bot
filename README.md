# Canvas Discord Bot

A Discord bot that fetches and displays your upcoming Canvas assignments from the University of Alberta's Canvas LMS directly in Discord.

## Features

- 📚 Fetches assignments from all your active Canvas courses
- 📅 Shows only assignments due within the next 3 days
- 🔗 Provides direct links to each assignment
- ⏰ Displays formatted due dates and times
- 🎨 Clean Discord embed formatting
- ✅ Automatically sorts assignments by due date
- 🔔 **Automatic daily reminders at 7 AM and 5 PM** (Mountain Time)
- 💬 **Manual commands** - check assignments anytime with `!assignments`

## Prerequisites

- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- A Discord account and server where you have permission to add bots
- A University of Alberta Canvas account

## Installation

### 1. Clone or Download the Project

Create a new folder and add the following files:
- `index.js` (main bot code)
- `package.json` (dependencies)
- `.env` (configuration - create this yourself)

### 2. Install Dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

This will install:
- `discord.js` - Discord bot framework
- `axios` - HTTP client for Canvas API
- `dotenv` - Environment variable management
- `node-cron` - Task scheduler for automatic reminders

### 3. Get Your Canvas API Token

1. Log in to [canvas.ualberta.ca](https://canvas.ualberta.ca)
2. Click on **Account** (left sidebar) → **Settings**
3. Scroll down to **"Approved Integrations"**
4. Click **"+ New Access Token"**
5. Give it a purpose name (e.g., "Discord Bot")
6. Click **"Generate Token"**
7. **Copy and save this token immediately** - you won't be able to see it again!

### 4. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Go to the **"Bot"** section in the left sidebar
4. Click **"Add Bot"** and confirm
5. Under the bot's username, click **"Reset Token"** and copy it
6. Scroll down to **"Privileged Gateway Intents"**
7. Enable **"MESSAGE CONTENT INTENT"**
8. Click **"Save Changes"**

### 5. Invite the Bot to Your Server

1. In the Discord Developer Portal, go to **OAuth2** → **URL Generator**
2. Select the following scopes:
   - ✅ `bot`
3. Select the following bot permissions:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Embed Links
4. Copy the generated URL at the bottom
5. Open the URL in your browser and select your server
6. Click **"Authorize"**

### 6. Configure Environment Variables

Create a file named `.env` in your project folder with the following content:

```env
# Discord Bot Token (from Discord Developer Portal)
DISCORD_TOKEN=your_discord_bot_token_here

# Canvas API Token (from canvas.ualberta.ca Account Settings)
CANVAS_TOKEN=your_canvas_api_token_here

# Discord Channel ID where automatic reminders will be sent
REMINDER_CHANNEL_ID=your_channel_id_here
```

Replace the placeholder values with your actual tokens.

⚠️ **Important:** Never share your `.env` file or commit it to version control!

### 7. Get Your Discord Channel ID (For Automatic Reminders)

To enable automatic daily reminders, you need to get the Channel ID:

**Enable Developer Mode:**
1. Open Discord and click the gear icon (User Settings)
2. Go to **Advanced** (under "App Settings")
3. Turn on **Developer Mode**

**Get the Channel ID:**
1. Right-click the channel where you want automatic reminders
2. Click **"Copy Channel ID"**
3. Paste it into your `.env` file as `REMINDER_CHANNEL_ID`

**Note:** If you don't want automatic reminders, you can skip this step or leave `REMINDER_CHANNEL_ID` empty. The manual `!assignments` command will still work.

## Usage

### Starting the Bot

Run the bot with:

```bash
npm start
```

You should see:
```
✅ Bot logged in as YourBotName#1234
⏰ Automatic reminders enabled for channel: 123456789012345678
📅 Reminders scheduled for 7:00 AM and 5:00 PM (Mountain Time)
```

The bot is now online and ready to use!

If you didn't set up `REMINDER_CHANNEL_ID`, you'll see:
```
✅ Bot logged in as YourBotName#1234
⚠️ No REMINDER_CHANNEL_ID set. Automatic reminders disabled.
💡 Add REMINDER_CHANNEL_ID to .env to enable automatic reminders.
```

### Commands

The bot supports both **automatic** and **manual** modes:

#### Automatic Daily Reminders
- **7:00 AM Mountain Time** - Morning reminder with upcoming assignments
- **5:00 PM Mountain Time** - Evening reminder with updated assignments
- Posts automatically to the channel specified in `REMINDER_CHANNEL_ID`
- Includes "Automatic Daily Reminder" footer to distinguish from manual requests

#### Manual Commands
In any Discord channel where the bot has access, type:

- `!assignments` - Fetch and display upcoming assignments on demand
- `!canvas` - Alternative command (same as !assignments)

Both modes show the same information - assignments due within the next 3 days.

### Example Output

When you run the command, the bot will display:

```
📚 Assignments Due in Next 3 Days

1. CMPUT 201 Lab 5
Due: Mon, Oct 7, 11:59 PM
Course: CMPUT 201 - Practical Programming Methodology
https://canvas.ualberta.ca/courses/12345/assignments/67890

2. MATH 125 Assignment 3
Due: Wed, Oct 9, 11:59 PM
Course: MATH 125 - Linear Algebra I
https://canvas.ualberta.ca/courses/23456/assignments/78901

Total: 2 assignments
```

If there are no assignments due:
```
📚 Upcoming Assignments
No assignments due in the next 3 days! 🎉
```

## Configuration

### Changing the Reminder Times

By default, reminders are sent at 7:00 AM and 5:00 PM Mountain Time. To change these times, edit the cron schedules in `index.js` around lines 168-180:

```javascript
// 7 AM MT - Change '0 7' to your desired time
cron.schedule('0 7 * * *', () => {
  sendScheduledReminder();
}, {
  timezone: 'America/Edmonton'
});

// 5 PM MT (17:00) - Change '0 17' to your desired time
cron.schedule('0 17 * * *', () => {
  sendScheduledReminder();
}, {
  timezone: 'America/Edmonton'
});
```

**Cron format:** `minute hour * * *`
- `0 7` = 7:00 AM
- `0 17` = 5:00 PM (17:00)
- `30 9` = 9:30 AM
- `0 12` = 12:00 PM (noon)

### Changing the Reminder Channel

Simply update the `REMINDER_CHANNEL_ID` in your `.env` file with a different channel ID and restart the bot.

### Disabling Automatic Reminders

Remove or comment out the `REMINDER_CHANNEL_ID` line in your `.env` file. The manual commands will still work.

### Changing the Time Window

By default, the bot shows assignments due within 3 days. To change this, edit line 24 in `index.js`:

```javascript
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3); // Change 3 to your preferred number
```

### Adding Custom Commands

You can add more command triggers by modifying the message handler around line 195:

```javascript
if (message.content.toLowerCase() === '!assignments' || 
    message.content.toLowerCase() === '!canvas' ||
    message.content.toLowerCase() === '!homework') { // Add your custom command
```

### Changing Timezone

If you're not in Mountain Time, change the timezone in the cron schedules around lines 168-180:

```javascript
cron.schedule('0 7 * * *', () => {
  sendScheduledReminder();
}, {
  timezone: 'America/Edmonton' // Change to your timezone
});
```

Common timezones:
- `America/Toronto` - Eastern Time
- `America/New_York` - Eastern Time
- `America/Chicago` - Central Time
- `America/Denver` - Mountain Time
- `America/Los_Angeles` - Pacific Time
- `America/Vancouver` - Pacific Time

## Troubleshooting

### Bot doesn't respond to commands

**Solution:**
1. Make sure **MESSAGE CONTENT INTENT** is enabled in Discord Developer Portal
2. Click **"Save Changes"** after enabling
3. Restart the bot
4. Wait a few minutes for Discord to update

### "Used disallowed intents" error

**Solution:** You haven't enabled MESSAGE CONTENT INTENT. See step 4 in the Discord Bot setup above.

### Canvas API errors

**Solution:**
1. Verify your Canvas token is correct and hasn't expired
2. Test the token manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://canvas.ualberta.ca/api/v1/courses
   ```
3. Generate a new token if needed

### Bot shows offline

**Solution:**
1. Check that `DISCORD_TOKEN` in `.env` is correct
2. Make sure the bot process is running (`npm start`)
3. Verify the bot is still in your server (check member list)

### No assignments showing but you know you have some

**Solution:**
1. Check that assignments have due dates set in Canvas
2. Verify assignments are due within the 3-day window
3. Make sure you're enrolled in the courses as a student

### Automatic reminders not sending

**Solution:**
1. Verify `REMINDER_CHANNEL_ID` is set correctly in `.env`
2. Make sure the bot has permission to send messages in that channel
3. Check the bot console for error messages at 7 AM or 5 PM
4. Verify your server time matches Mountain Time or adjust timezone in code
5. Wait until the scheduled time - reminders only send at 7 AM and 5 PM

### Wrong timezone for reminders

**Solution:** Change the timezone in the cron schedules (see Configuration section above)

## Security Notes

⚠️ **Important Security Practices:**

- Never share your `.env` file
- Never commit `.env` to Git (add it to `.gitignore`)
- Never share your Canvas API token
- Never share your Discord bot token
- Regenerate tokens immediately if they're exposed
- Only run this bot in trusted environments

## API Rate Limits

- Canvas API: Generally allows 3000 requests per hour per token
- This bot makes one request per course, so it should be well within limits
- Avoid running the command excessively to prevent rate limiting

## File Structure

```
canvas-discord-bot/
├── index.js          # Main bot code
├── package.json      # Dependencies and scripts
├── .env              # Environment variables (create this)
├── .gitignore        # Git ignore file (recommended)
└── README.md         # This file
```

## Recommended .gitignore

Create a `.gitignore` file with:

```
node_modules/
.env
*.log
```

## Support

For issues specific to:
- **Canvas API:** [Canvas API Documentation](https://canvas.instructure.com/doc/api/)
- **Discord.js:** [Discord.js Guide](https://discordjs.guide/)
- **University of Alberta Canvas:** Contact UAlberta IT Support

## License

This project is provided as-is for educational purposes. Feel free to modify and use it for your personal needs.

## Contributing

Feel free to fork and improve this bot! Some ideas for enhancements:
- ✅ Daily automatic reminders (implemented!)
- Add reminders for specific assignment deadlines (e.g., 1 hour before)
- Filter by specific courses
- Show assignments due this week
- Add task completion tracking
- Support for multiple users with different Canvas tokens
- Quiz and exam reminders
- Grade notifications

---

Made with ❤️ for UAlberta students
