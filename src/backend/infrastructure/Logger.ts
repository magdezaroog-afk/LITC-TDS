import fs from 'fs';
import path from 'path';

const logDirectory = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const auditLogPath = path.join(logDirectory, 'audit.log');
const errorLogPath = path.join(logDirectory, 'error.log');
const securityLogPath = path.join(logDirectory, 'security.log');

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
  AUDIT = 'AUDIT'
}

class SystemLogger {
  private writeLog(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta })
    };

    const logString = JSON.stringify(logEntry) + '\n';

    // In development or if explicitly allowed, also print safely to stdout without breaking SIEM parsers
    if (process.env.NODE_ENV !== 'production' || level === LogLevel.ERROR) {
      if (level === LogLevel.ERROR) {
        console.error(`[${timestamp}] [${level}] ${message}`);
      } else {
        // Outputting standard info for debugging (Sanitized console)
        console.info(`[${timestamp}] [${level}] ${message}`);
      }
    }

    // Write to appropriate file based on level
    if (level === LogLevel.ERROR) {
      fs.appendFileSync(errorLogPath, logString);
    } else if (level === LogLevel.SECURITY) {
      fs.appendFileSync(securityLogPath, logString);
    } else if (level === LogLevel.AUDIT) {
      fs.appendFileSync(auditLogPath, logString);
    } else {
      // General app logs can go to audit.log as well for now, or an app.log
      fs.appendFileSync(auditLogPath, logString);
    }
  }

  info(message: string, meta?: any) {
    this.writeLog(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: any) {
    this.writeLog(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: any) {
    this.writeLog(LogLevel.ERROR, message, meta);
  }

  security(message: string, meta?: any) {
    this.writeLog(LogLevel.SECURITY, message, meta);
  }

  audit(message: string, meta?: any) {
    this.writeLog(LogLevel.AUDIT, message, meta);
  }
}

export const Logger = new SystemLogger();
