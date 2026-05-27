#!/usr/bin/env node
import { parseCliArgs, run } from "../dist/index.js";

const opts = parseCliArgs(process.argv.slice(2));
await run(opts);
