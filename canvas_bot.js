const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CANVAS_TOKEN = process.env.CANVAS_TOKEN;
const REMINDER_CHANNEL_ID = process.env.REMINDER_CHANNEL_ID;
const CANVAS_API_URL = 'https://canvas.ualberta.ca/api/v1';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Canvas API helper
async function getCanvasAssignments() {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    // Get all active courses
    const coursesResponse = await axios.get(`${CANVAS_API_URL}/courses`, {
      headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
      params: {
        enrollment_state: 'active',
        per_page: 100
      }
    });

    const courses = coursesResponse.data;
    const allAssignments = [];

    // Get assignments for each course
    for (const course of courses) {
      try {
        const assignmentsResponse = await axios.get(
          `${CANVAS_API_URL}/courses/${course.id}/assignments`,
          {
            headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
            params: {
              order_by: 'due_at',
              per_page: 100
            }
          }
        );

        const assignments = assignmentsResponse.data;
        
        // Filter assignments due within next 3 days
        const upcomingAssignments = assignments.filter(assignment => {
          if (!assignment.due_at) return false;
          
          const dueDate = new Date(assignment.due_at);
          const now = new Date();
          
          return dueDate >= now && dueDate <= threeDaysFromNow;
        });

        // Add course name to each assignment
        upcomingAssignments.forEach(assignment => {
          assignment.courseName = course.name;
        });

        allAssignments.push(...upcomingAssignments);
      } catch (err) {
        console.error(`Error fetching assignments for course ${course.id}:`, err.message);
      }
    }

    // Sort by due date
    allAssignments.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

    return allAssignments;
  } catch (error) {
    console.error('Error fetching Canvas data:', error.message);
    throw error;
  }
}

// Format date nicely in Mountain Time
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Edmonton'
  };
  return date.toLocaleString('en-US', options);
}

// Create assignment embed
function createAssignmentEmbed(assignments, isScheduled = false) {
  if (assignments.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('📚 Upcoming Assignments')
      .setDescription('No assignments due in the next 3 days! 🎉')
      .setTimestamp();

    if (isScheduled) {
      embed.setFooter({ text: 'Automatic Daily Reminder' });
    }

    return embed;
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📚 Assignments Due in Next 3 Days')
    .setTimestamp();

  if (isScheduled) {
    embed.setFooter({ text: `Automatic Daily Reminder • Total: ${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}` });
  } else {
    embed.setFooter({ text: `Total: ${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}` });
  }

  // Add fields for each assignment
  assignments.forEach((assignment, index) => {
    const dueDate = formatDate(assignment.due_at);
    const fieldValue = `**Due:** ${dueDate}\n**Course:** ${assignment.courseName}\n${assignment.html_url}`;
    
    embed.addFields({
      name: `${index + 1}. ${assignment.name}`,
      value: fieldValue,
      inline: false
    });
  });

  return embed;
}

// Send scheduled reminder
async function sendScheduledReminder() {
  if (!REMINDER_CHANNEL_ID) {
    console.log('⚠️ No REMINDER_CHANNEL_ID set. Skipping scheduled reminder.');
    return;
  }

  try {
    const channel = await client.channels.fetch(REMINDER_CHANNEL_ID);
    
    if (!channel) {
      console.error('❌ Could not find reminder channel');
      return;
    }

    console.log('📬 Sending scheduled reminder...');
    const assignments = await getCanvasAssignments();
    const embed = createAssignmentEmbed(assignments, true);
    
    await channel.send({ embeds: [embed] });
    console.log('✅ Scheduled reminder sent successfully');
  } catch (error) {
    console.error('❌ Error sending scheduled reminder:', error);
  }
}

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  
  if (REMINDER_CHANNEL_ID) {
    console.log('⏰ Automatic reminders enabled for channel:', REMINDER_CHANNEL_ID);
    console.log('📅 Reminders scheduled for 7:00 AM and 5:00 PM (Mountain Time)');
  } else {
    console.log('⚠️ No REMINDER_CHANNEL_ID set. Automatic reminders disabled.');
    console.log('💡 Add REMINDER_CHANNEL_ID to .env to enable automatic reminders.');
  }

  // Schedule reminders at 7 AM and 5 PM Mountain Time (America/Edmonton)
  // Cron format: minute hour * * *
  // 7 AM MT
  cron.schedule('0 7 * * *', () => {
    console.log('⏰ 7 AM reminder triggered');
    sendScheduledReminder();
  }, {
    timezone: 'America/Edmonton'
  });

  // 5 PM MT
  cron.schedule('0 17 * * *', () => {
    console.log('⏰ 5 PM reminder triggered');
    sendScheduledReminder();
  }, {
    timezone: 'America/Edmonton'
  });
});

// Message handler for manual commands
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Command: !assignments or !canvas
  if (message.content.toLowerCase() === '!assignments' || 
      message.content.toLowerCase() === '!canvas') {
    
    await message.channel.send('🔍 Fetching your Canvas assignments...');

    try {
      const assignments = await getCanvasAssignments();
      const embed = createAssignmentEmbed(assignments, false);
      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      await message.channel.send('❌ Error fetching assignments. Please check your Canvas token and try again.');
      console.error('Error:', error);
    }
  }
});

// Login to Discord
client.login(DISCORD_TOKEN);
