const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CANVAS_TOKEN = process.env.CANVAS_TOKEN;
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

// Format date nicely
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
}

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// Message handler
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Command: !assignments or !canvas
  if (message.content.toLowerCase() === '!assignments' || 
      message.content.toLowerCase() === '!canvas') {
    
    await message.channel.send('🔍 Fetching your Canvas assignments...');

    try {
      const assignments = await getCanvasAssignments();

      if (assignments.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('📚 Upcoming Assignments')
          .setDescription('No assignments due in the next 3 days! 🎉')
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        return;
      }

      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📚 Assignments Due in Next 3 Days')
        .setTimestamp()
        .setFooter({ text: `Total: ${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}` });

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

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      await message.channel.send('❌ Error fetching assignments. Please check your Canvas token and try again.');
      console.error('Error:', error);
    }
  }
});

// Login to Discord
client.login(DISCORD_TOKEN);
