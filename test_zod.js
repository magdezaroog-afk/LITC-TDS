const express = require('express');
const { assignUserSchema } = require('./dist/backend/validators/OrgValidators.js');

const reqBody = { userId: 1045, departmentId: null, teamId: null, roleId: 26 };
try {
  assignUserSchema.parse(reqBody);
  console.log('Validation passed!');
} catch (e) {
  console.log('Validation failed:', e.errors);
}
