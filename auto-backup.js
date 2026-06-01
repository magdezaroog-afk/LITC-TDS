const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const WATCH_DIR = path.join(__dirname, 'src');
const DEBOUNCE_DELAY = 10000; // 10 seconds to avoid spamming builds/commits
let timeout = null;
let isRunning = false;

console.log(`[Auto-Backup] Started smart watcher on ${WATCH_DIR}...`);

function triggerBackup() {
    if (isRunning) return; // Wait until previous backup is finished
    isRunning = true;
    
    console.log('[Auto-Backup] Changes detected! Running production build check...');
    
    // 1. Run build silently
    exec('npm run build:prod', (error, stdout, stderr) => {
        if (error) {
            console.error('[Auto-Backup] Build failed. Skipping git commit to maintain stability.');
            isRunning = false;
            return;
        }
        
        console.log('[Auto-Backup] Build succeeded. Committing and pushing to origin main...');
        
        // 2. Git operations
        const gitCmd = `git add . && git commit -m "auto: snapshot update before next generation" && git push origin main`;
        
        exec(gitCmd, (gitError, gitStdout, gitStderr) => {
            if (gitError) {
                // If there's nothing to commit, git returns an error, which we can safely ignore
                if (gitStdout.includes('nothing to commit')) {
                    console.log('[Auto-Backup] Nothing to commit.');
                } else {
                    console.error('[Auto-Backup] Git error:', gitStderr || gitError.message);
                }
            } else {
                console.log('[Auto-Backup] Successfully backed up to remote repository!');
            }
            isRunning = false;
        });
    });
}

// Smart Watcher using built-in fs module
fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.css'))) {
        if (timeout) {
            clearTimeout(timeout);
        }
        // Debounce to wait until the user finishes saving multiple files
        timeout = setTimeout(triggerBackup, DEBOUNCE_DELAY);
    }
});
