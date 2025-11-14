// // src/test/suite/extension.test.ts
// import * as assert from 'assert';
// import * as vscode from 'vscode';

// suite('CommitDiary extension', () => {
//   test('discover command executes', async () => {
//     await vscode.commands.executeCommand('commitDiary.discoverRepos');
//     assert.ok(true, 'Command executed without throwing');
//   });

//   test('discoverRepositories returns array', async () => {
//     // Import from compiled output to avoid TS path issues
//     const ext = await import('../../../out/extension.js');
//     const arr = await ext.discoverRepositories();
//     assert.ok(Array.isArray(arr));
//   });
// });