// src/index.ts
import { Client, GatewayIntentBits, Collection, SlashCommandBuilder, CommandInteraction } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fs from 'fs/promises'; // Using promises version for async/await

// Load environment variables from .env file
dotenv.config();

// Define a custom interface for the Client to include commands
// This is a common pattern to extend the Client object with your bot's specific properties
interface DiscordClient extends Client {
  commands?: Collection<string, { data: SlashCommandBuilder; execute: (interaction: CommandInteraction) => Promise<void> }>;
}

// --- Discord Bot Setup ---
const client: DiscordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Required for guild-related events (e.g., guild create, delete)
    GatewayIntentBits.GuildMessages,    // Required to receive messages in guilds
    GatewayIntentBits.MessageContent,   // REQUIRED to read message content (for prefix commands or message scanning)
    GatewayIntentBits.DirectMessages,   // To receive messages in DMs
    // Add other intents as needed based on your bot's functionality
  ],
});

// Initialize commands collection
client.commands = new Collection();

// Function to dynamically load commands
async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  try {
    const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      // Use dynamic import for ESM compatibility.
      // Make sure your commands are exported with `export const data` and `export async function execute`.
      const command = await import(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands?.set(command.data.name, command);
      } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
    console.log(`Loaded ${client.commands.size} commands.`);
  } catch (error) {
    console.error('Error loading commands:', error);
  }
}

// Discord Bot Ready Event
client.once('ready', async () => {
  console.log(`Discord bot is ready! Logged in as ${client.user?.tag}`);
  await loadCommands(); // Load commands when the bot is ready
});

// Discord Interaction Create Event (for Slash Commands)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return; // Only handle slash commands

  const command = client.commands?.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// --- Express Server Setup ---
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// Example Express Route
app.get('/', (req, res) => {
  res.send('Discord bot is running and Express server is active!');
});

// Example API endpoint to get bot info (just an example)
app.get('/api/bot-info', (req, res) => {
  if (client.isReady()) {
    res.json({
      tag: client.user?.tag,
      id: client.user?.id,
      guildCount: client.guilds.cache.size,
      uptime: client.uptime ? client.uptime / 1000 : 0, // uptime in seconds
    });
  } else {
    res.status(503).json({ message: 'Bot is not ready yet.' });
  }
});

// Example API endpoint to send a message to a specific channel (be careful with abuse!)
app.post('/api/send-message', async (req, res) => {
  const { channelId, message } = req.body;

  if (!channelId || !message) {
    return res.status(400).json({ error: 'Missing channelId or message in request body.' });
  }

  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel?.isTextBased()) { // Ensure it's a text-based channel
      return res.status(400).json({ error: 'Provided channelId is not a valid text channel.' });
    }

    await channel.send(message);
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending message via API:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// --- Start both services ---
async function startServices() {
  try {
    // Start the Discord bot
    await client.login(process.env.DISCORD_TOKEN);

    // Start the Express server
    app.listen(port, () => {
      console.log(`Express server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start services:', error);
    process.exit(1); // Exit with error code
  }
}

startServices();