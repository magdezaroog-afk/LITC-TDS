const fs = require('fs');
const file = 'src/backend/controllers/FunctionalController.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix getMe
content = content.replace(/name: true,/g, 'fullName: true,');
content = content.replace(/name: userData.name,/g, 'name: userData.fullName || userData.username,');
content = content.replace(/department: true,/g, 'department: { select: { name: true } },');
content = content.replace(/department: userData.department,/g, 'department: userData.department?.name || \"\",');
content = content.replace(/role: true,/g, 'role: { select: { name: true } },');
content = content.replace(/role: userData.role,/g, 'role: userData.role?.name || \"\",');

// Fix duplicate getChallenges and createChallenge
// The duplicate ones are from line 101 to 160 approx.
content = content.replace(/\/\/ GET \/api\/v1\/functional\/challenges[\s\S]*?\/\/ GET \/api\/v1\/functional\/posts/, '// GET /api/v1/functional/posts');

// Fix departmentName in getChallenges
content = content.replace(/department: ch.departmentName,/g, 'department: ch.department?.name || \"\",');
content = content.replace(/include: \{[\s\S]*?participations:/, 'include: { department: { select: { name: true } }, participations:');

// Fix TicketController stuff (lines 555, 609, 636, 643) 
content = content.replace(/description: any/g, 'description: string');
content = content.replace(/name: true/g, 'fullName: true');

fs.writeFileSync(file, content);
