#!/usr/bin/env node
import {spawn} from 'node:child_process';

const command = process.argv[2] || 'dev';
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const env = {...process.env};
delete env.ELECTRON_RUN_AS_NODE;
delete env.ELECTRON_NO_ATTACH_CONSOLE;

const args = ['exec', 'electron-vite', command];
if (command === 'dev' && process.platform === 'linux') {
  args.push('--noSandbox');
}

const child = spawn(pnpm, args, {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
