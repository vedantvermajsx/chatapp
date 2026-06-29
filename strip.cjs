const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const stripComments = require('strip-comments');

const workspaces = ['backend', 'frontend/src', 'cacheService', 'loadbalancer'];

workspaces.forEach((workspace) => {
  const directory = path.join(__dirname, workspace);
  const files = globSync('**/*.{js,jsx}', { cwd: directory, ignore: ['**/node_modules/**'] });
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    try {
      const stripped = stripComments(content);
      if (content !== stripped) {
        fs.writeFileSync(fullPath, stripped, 'utf8');
        console.log(`Stripped comments from: ${fullPath}`);
      }
    } catch (e) {
      console.error(`Failed to strip comments from ${fullPath}:`, e);
    }
  });
});
