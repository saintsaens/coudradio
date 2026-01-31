import { createChannel } from "./services/channelCreationService/channelService.js";
import dotenv from "dotenv";

dotenv.config();

const channelName = process.argv[2];

if (!channelName) {
    console.error("Usage: node creatChannel.js <channelName>");
    process.exit(1);
}

console.log(`Creating channel: ${channelName}`);
createChannel(channelName);
