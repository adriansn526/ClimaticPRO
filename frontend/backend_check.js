const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const signTest = jwt.sign({ userId: 'installer_test_001', role: 'installer' }, JWT_SECRET, { expiresIn: '7d' });

async function check() {
  const jobs = await prisma.job.findMany({
    where: { installerId: 'installer_test_001' }
  });
  console.log("Found jobs for installer_test_001:", jobs);

  const req = await fetch('http://localhost:3010/api/mobile/jobs', {
    headers: { 'Authorization': `Bearer ${signTest}` }
  });
  const data = await req.json();
  console.log("API Response:", data);
}
check();
