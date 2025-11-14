// // tests/repoDiscovery.fallback.test.ts
// import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// import * as fs from 'node:fs/promises';
// import * as path from 'node:path';
// import * as os from 'node:os';


// let tmpDir: string;

// async function mkRepo(root: string, name: string) {
//   const repo = path.join(root, name);
//   await fs.mkdir(path.join(repo, '.git'), { recursive: true });
//   await fs.writeFile(path.join(repo, '.git', 'config'), '[core]\n\trepositoryformatversion = 0\n');
//   return repo;
// }

// beforeAll(async () => {
//   tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'commitdiary-test-'));
//   await mkRepo(tmpDir, 'repoA');
//   await mkRepo(tmpDir, 'nested/repoB');
//   await fs.mkdir(path.join(tmpDir, 'node_modules', 'ignoreme'), { recursive: true });
// });

// afterAll(async () => {
//   // Cleanup
//   try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
// });

// describe('scanForGitReposFromFs', () => {
//   it('finds repos under roots and ignores excluded folders', async () => {
//     const found = await scanForGitReposFromFs([tmpDir], { maxDepth: 5 });
//     // Expect both repoA and nested/repoB
//     expect(found.some(p => p.endsWith('repoA'))).toBe(true);
//     expect(found.some(p => p.endsWith(path.join('nested', 'repoB')))).toBe(true);
//     // Ensure node_modules content didn’t appear as a repo
//     expect(found.some(p => p.includes('node_modules'))).toBe(false);
//   });
// });