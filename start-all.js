import { spawn } from 'child_process';

const services = [
  {
    name: 'CacheService',
    command: 'npm',
    args: ['run', 'start'],
    cwd: './cacheservice',
    wait: 5000
  },
  {
    name: 'MessageBroker',
    command: 'npm',
    args: ['run', 'start'],
    cwd: './messagebroker',
    wait:5000
  },
  {
    name: 'QueueService',
    command: 'npm',
    args: ['run', 'start'],
    cwd: './queueservice',
    wait:5000
  },
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: './frontend',
    wait:1000
  }
];

const children = [];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServices() {
  for (const service of services) {
    console.log(`Starting ${service.name}...`);

    const child = spawn(service.command, service.args, {
      cwd: service.cwd,
      shell: true,
      stdio: 'inherit'
    });

    children.push(child);

    child.on('error', (err) => {
      console.error(`${service.name} failed:`, err.message);
    });

    await sleep(service.wait);
  }
}

startServices();

process.on('SIGINT', () => {
  console.log('\nStopping all services...');

  children.forEach(child => child.kill('SIGINT'));

  process.exit();
});