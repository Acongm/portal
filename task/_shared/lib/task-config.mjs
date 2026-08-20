import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(new URL('../../..', import.meta.url).pathname);

export function getRepoRoot() {
  return repoRoot;
}

export async function loadTaskConfig(taskId) {
  const taskDir = path.join(repoRoot, 'task', taskId);
  const configPath = path.join(taskDir, 'task.json');
  const raw = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(raw);
  if (config.id !== taskId) {
    throw new Error(`task.json id mismatch: expected ${taskId}, got ${config.id}`);
  }
  return { taskDir, config, repoRoot };
}

export function resolveDate(envDate) {
  const value = envDate || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`DATE must be YYYY-MM-DD, got: ${value}`);
  }
  return value;
}

export function padLesson(num) {
  return String(num).padStart(2, '0');
}

export async function resolveSlug({ config, contentDir, date, lessonNumber }) {
  if (config.filename === 'lesson') {
    const lesson = lessonNumber ?? (await nextLessonNumber(contentDir, config.lessonPrefix ?? 'lesson-'));
    return `${config.lessonPrefix ?? 'lesson-'}${padLesson(lesson)}`;
  }
  return date;
}

export async function nextLessonNumber(contentDir, prefix = 'lesson-') {
  const entries = await fs.readdir(contentDir).catch(() => []);
  const numbers = entries
    .filter((name) => name.startsWith(prefix) && name.endsWith('.mdx'))
    .map((name) => Number.parseInt(name.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n));
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
}

export async function loadSyllabus(taskDir, config) {
  if (!config.syllabusFile) return null;
  const syllabusPath = path.join(taskDir, config.syllabusFile);
  const raw = await fs.readFile(syllabusPath, 'utf8');
  return JSON.parse(raw);
}

export function getLessonFromSyllabus(syllabus, lessonNumber) {
  if (!syllabus?.lessons?.length) return null;
  return syllabus.lessons.find((item) => item.lesson === lessonNumber) ?? null;
}

export function substituteTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, String(value ?? ''));
  }
  return result;
}
