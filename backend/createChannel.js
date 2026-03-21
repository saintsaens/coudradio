import { createChannel } from "./services/channelCreationService/channelService.js";
import dotenv from "dotenv";

dotenv.config();

const channelName = process.argv[2];

if (!channelName) {
    console.error("Usage: node creatChannel.js <channelName>");
    process.exit(1);
}

console.log(`Creating channel: ${channelName}`);
await createChannel(channelName);
console.log(`\nDone! Add "${channelName}" to VITE_CHANNELS_DEFAULT or VITE_CHANNELS_LOGGEDIN in frontend/.env to make it available in the frontend.`);
