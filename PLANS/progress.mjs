#!/usr/bin/env node
// Counts checklist tasks and rewrites the table in checklists/PROGRESS.md.
// Usage: node PLANS/progress.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, 'checklists');
const TASK = /^\s*- \[( |x|X)\] ([A-Z]+-V?\d+)\b(.*)$/;
const START = '<!-- progress:start -->';
const END = '<!-- progress:end -->';

const files = (await readdir(dir)).filter((f) => /^\d\d-.+\.md$/.test(f)).sort();
const rows = [];
let totalDone = 0;
let total = 0;

for (const file of files) {
  const text = await readFile(path.join(dir, file), 'utf8');
  const title = (text.match(/^#\s+(.+)$/m) || [null, file])[1];
  let done = 0, count = 0, active = 0, blocked = 0, stretchDone = 0, stretchCount = 0;
  for (const line of text.split(/\r?\n/)) {
    const m = TASK.exec(line);
    if (!m) continue;
    const isDone = m[1].toLowerCase() === 'x';
    if (/\(stretch\)/i.test(line)) {
      stretchCount++;
      if (isDone) stretchDone++;
      continue;
    }
    count++;
    if (isDone) done++;
    else if (line.includes('🚧')) active++;
    else if (line.includes('⛔')) blocked++;
  }
  totalDone += done;
  total += count;
  const pct = count ? Math.round((done / count) * 100) : 0;
  const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
  rows.push(
    `| [${title}](${file}) | ${done}/${count} | ${pct}% ${bar} | ${active} | ${blocked} | ${stretchDone}/${stretchCount} |`,
  );
}

const overall = total ? Math.round((totalDone / total) * 100) : 0;
const table = [
  START,
  '| Phase | Done | Progress | In progress | Blocked | Stretch |',
  '| --- | --- | --- | --- | --- | --- |',
  ...rows,
  `| **Total** | **${totalDone}/${total}** | **${overall}%** | | | |`,
  END,
].join('\n');

const target = path.join(dir, 'PROGRESS.md');
let current = '';
try { current = await readFile(target, 'utf8'); } catch { /* new file */ }
const next = current.includes(START) && current.includes(END)
  ? current.replace(new RegExp(`${START}[\\s\\S]*?${END}`), table)
  : `# Progress\n\n${table}\n`;
await writeFile(target, next);
console.log(`${totalDone}/${total} tasks done (${overall}%)`);
