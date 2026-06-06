const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const envFile = path.join(__dirname, '..', '.env.neon');
const content = fs.readFileSync(envFile, 'utf8');

const overrides = {};
for (const line of content.split('\n')) {
  const match = line.match(/^([A-Z_]+)\s*=\s*["']?([^"'\n]*)["']?/);
  if (match) overrides[match[1]] = match[2];
}

const cmd = process.argv.slice(2).join(' ');
execSync(cmd, {
  stdio: 'inherit',
  env: { ...process.env, ...overrides },
});
