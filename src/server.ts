import app from './expressApp';
import { DatabaseBackupJob } from './jobs/DatabaseBackupJob';

const port = process.env.BACKEND_PORT || 5555;

// Initialize Automated DB Backup Job
const backupJob = new DatabaseBackupJob();
backupJob.start(86400000); // Polls every 24 hours

const server = app.listen(port, () => {
  console.log(`[LITC-TS Server] Production Environment (v43_Production) running on http://localhost:${port}`);
});

// Safety: Prevent transient background errors (such as Redis connection drops) from killing the process
process.on('uncaughtException', (err) => {
  console.error('[LITC-TS Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[LITC-TS Server] Unhandled Promise Rejection:', reason);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[LITC-TS Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[LITC-TS Server] HTTP server closed.');
    process.exit(0);
  });
});

