/**
 * 从 summaries-v1 快照生成 module-index.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_PATHS,
  buildModuleIndex,
} from './ai-summary-v1.mjs';

const root = process.cwd();
const summariesPath = join(root, DEFAULT_PATHS.publicFile);
const registryPath = join(root, DEFAULT_PATHS.registryFile);
const outputPath = join(root, DEFAULT_PATHS.moduleIndexFile);

const snapshot = JSON.parse(readFileSync(summariesPath, 'utf8'));
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const moduleIndex = buildModuleIndex(snapshot, registry);
writeFileSync(outputPath, `${JSON.stringify(moduleIndex, null, 2)}\n`, 'utf8');

console.log(
  `[generate-module-index] modules=${moduleIndex._meta.moduleCount} -> ${DEFAULT_PATHS.moduleIndexFile}`,
);
