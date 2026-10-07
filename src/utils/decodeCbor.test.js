import { spawnSync } from 'child_process';
import path from 'path';

it('passes the RFC vectors and decoder safety suite', () => {
  const testFile = path.join(process.cwd(), 'src', 'utils', 'decodeCbor.node-test.mjs');
  const result = spawnSync(process.execPath, [testFile], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error([
      `Decoder safety suite exited with status ${result.status}.`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/fail 0/);
});
