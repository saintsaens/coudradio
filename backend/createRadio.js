import { createChannel } from "./services/radioService.js";
import dotenv from "dotenv";

dotenv.config();

// Get the argument passed in the command line
const radioName = process.argv[2];

if (!radioName) {
    console.error("Usage: node createRadio.js <radioName>");
    process.exit(1);
}

console.log(`Creating radio: ${radioName}`);
await createChannel(radioName);
