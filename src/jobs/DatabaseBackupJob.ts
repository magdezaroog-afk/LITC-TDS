import fs from 'fs';
import path from 'path';

export class DatabaseBackupJob {
  private timer: NodeJS.Timeout | null = null;
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Starts the daily backup job.
   */
  start(intervalMs: number = 86400000 /* 24 hours */): void {
    if (this.timer) return;

    console.log(`[DatabaseBackupJob] Automated DB Backup scheduled every ${intervalMs} ms.`);
    
    // Run an initial backup immediately upon startup
    this.executeBackup();

    this.timer = setInterval(() => {
      this.executeBackup();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[DatabaseBackupJob] Automated DB Backup stopped.');
    }
  }

  private executeBackup() {
    try {
      // For SQLite, we can simply copy the .db file
      // If PostgreSQL or other, use pg_dump or prisma export commands
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(dbPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const destPath = path.join(this.backupDir, `backup-${timestamp}.db`);
        fs.copyFileSync(dbPath, destPath);
        console.log(`[DatabaseBackupJob] Sovereign Backup completed successfully: ${destPath}`);
      } else {
        console.log('[DatabaseBackupJob] SQLite db file not found. Ensure Database configuration.');
      }
    } catch (err) {
      console.error('[DatabaseBackupJob] Failed to execute backup:', err);
    }
  }
}
