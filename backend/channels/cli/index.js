#!/usr/bin/env node
import './loadEnv.js';
import { COMMANDS, UsageError } from './commands.js';

const USAGE = `Usage: npm run channel -- <command>

  status [channel…]                 Overview of every channel, or of the given ones
  tracks <channel> [--sources]      Tracklist with start times and what is playing now
  verify <channel>                  Checks the segments in MinIO and that the live MPD matches the channel
  bootstrap <channel…|--all> [--write] [--force]
                                    Creates channel.json from the live MPD (dry run unless --write)
  sync <channel…|--all> [--dry-run] Regenerates the MPD and tracks.json from channel.json
  sync <channel> --file <path>      Applies an edited channel.json (reorder, remove, retitle, set sources)
  export <channel> [path]           Saves channel.json locally for editing (default: ./<channel>.json)
  add <channel> [file…] [--sorted] [--dry-run]
                                    Encodes bucket files not in the channel yet and appends them
                                    (--sorted inserts them in source order). Creates the channel if needed
  reencode <channel> [#|from-to…] [--missing] [--outdated] [--all] [--force] [--dry-run]
                                    Re-encodes tracks from their source file: given numbers, tracks with
                                    missing segments, or tracks encoded before loudness normalization`;

const VALUE_FLAGS = ['file'];
const [command, ...rest] = process.argv.slice(2);
const flags = {};
const args = [];
for (let index = 0; index < rest.length; index++) {
    const arg = rest[index];
    if (!arg.startsWith('--')) {
        args.push(arg);
        continue;
    }
    const name = arg.slice(2);
    flags[name] = VALUE_FLAGS.includes(name) ? rest[++index] : true;
}

if (!COMMANDS[command]) {
    console.error(USAGE);
    process.exit(1);
}

try {
    await COMMANDS[command](args, flags);
} catch (err) {
    if (err instanceof UsageError) {
        console.error(USAGE);
        process.exit(1);
    }
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
}
process.exit();
