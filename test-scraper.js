require('dotenv').config({ path: './frontend/.env.local' });
require('dotenv').config({ path: './frontend/.env' });
const { PrismaClient } = require('./frontend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { runUniversalScraper } = require('./frontend/.next/server/chunks/SOME_CHUNK.js'); // Not easy

// Actually I can just trigger it using docker exec node
