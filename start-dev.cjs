process.chdir(__dirname);
require('child_process').execSync('npx vite --host', { stdio: 'inherit', env: { ...process.env, PATH: process.env.PATH + ';C:\\Program Files\\nodejs' } });
