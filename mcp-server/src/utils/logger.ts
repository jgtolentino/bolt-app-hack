import fs from 'fs';
import path from 'path';

const LOG_FILE = process.env.MCP_LOG_FILE || path.join(process.cwd(), 'mcp-debug.log');
const DEBUG = process.env.MCP_DEBUG === 'true';

export function logDebug(message: string, meta?: any): void {
  if (!DEBUG) return;
  writeLog('DEBUG', message, meta);
}

export function logInfo(message: string, meta?: any): void {
  writeLog('INFO', message, meta);
}

export function logError(message: string, meta?: any): void {
  writeLog('ERROR', message, meta);
}

function writeLog(level: string, message: string, meta?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} [${level}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    // Silently fail - no console output
  }
}
