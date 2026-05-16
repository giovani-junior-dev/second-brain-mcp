import { homedir } from 'node:os';
import { join } from 'node:path';

export const BRAIN_DIR = join(homedir(), '.brain');
export const DB_FILE = join(BRAIN_DIR, 'brain.db');
export const CONFIG_FILE = join(BRAIN_DIR, 'config.toml');
export const SKILLS_DIR = join(BRAIN_DIR, 'skills');

export const DEFAULT_CONFIG = `# second-brain-mcp config
llm_provider = "anthropic"
log_level = "info"
`;
