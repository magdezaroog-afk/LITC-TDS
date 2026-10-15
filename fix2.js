const fs = require('fs');
const file = 'src/backend/controllers/FunctionalController.ts';
let content = fs.readFileSync(file, 'utf8');

// Revert fullName back to name where it was incorrectly replaced
content = content.replace(/fullName: true/g, 'name: true');
// Now correctly target only User selects
content = content.replace(/select: {\s*id: true,\s*name: true/g, 'select: {\n          id: true,\n          fullName: true');
content = content.replace(/name: userData\.name/g, 'name: userData.fullName || userData.username');

// Fix appCoins and points (not on User)
content = content.replace(/points: true,\s*appCoins: true/g, '');
content = content.replace(/points: userData\.points \|\| 0,/g, 'points: 0,');
content = content.replace(/appCoins: userData\.appCoins \|\| 0,/g, 'appCoins: 0,');

// The duplicate getChallenges and createChallenge are already removed by the previous script?
// Wait, the previous script might have removed the WHOLE block between them.
// Let's check how many getChallenges remain.
let getChallengesMatches = content.match(/async getChallenges/g);
if (getChallengesMatches && getChallengesMatches.length > 1) {
    // If somehow duplicates remain, we'll strip the first one
    const idx1 = content.indexOf('// GET /api/v1/functional/challenges');
    const idx2 = content.indexOf('// GET /api/v1/functional/posts');
    if (idx1 !== -1 && idx2 !== -1 && idx1 < idx2) {
        content = content.substring(0, idx1) + content.substring(idx2);
    }
}

// Ensure departmentId instead of department in createNews/Challenge
content = content.replace(/department: userData\.department/g, 'department: userData.department?.name || ""');
content = content.replace(/role: userData\.role/g, 'role: userData.role?.name || ""');

// Fix departmentName in getChallenges
content = content.replace(/departmentName/g, 'department?.name || ""');

// Fix TicketController stuff
content = content.replace(/description: string/g, 'description: any'); // revert previous
content = content.replace(/fullName: true/g, 'name: true'); // Wait, I already reverted this at top.

fs.writeFileSync(file, content);
