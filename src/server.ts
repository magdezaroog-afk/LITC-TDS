import app from './app';
import { SlaMonitorJob } from './jobs/SlaMonitorJob';
import { DatabaseBackupJob } from './jobs/DatabaseBackupJob';

const port = process.env.BACKEND_PORT || 5555;

// Initialize and start the background SLA Monitor Job
const monitorJob = new SlaMonitorJob();
monitorJob.start(60000); // Polls every 60 seconds

// Initialize Automated DB Backup Job
const backupJob = new DatabaseBackupJob();
backupJob.start(86400000); // Polls every 24 hours

const server = app.listen(port, () => {
  console.log(`[LITC-TS Server] Production Environment (v43_Production) running on http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[LITC-TS Server] SIGTERM received. Shutting down gracefully...');
  monitorJob.stop();
  server.close(() => {
    console.log('[LITC-TS Server] HTTP server closed.');
    process.exit(0);
  });
});
