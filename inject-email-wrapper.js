const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, 'novu', 'workflows');
const files = fs.readdirSync(workflowsDir);

files.forEach(file => {
  if (!file.endsWith('.ts') || file === 'email-template.ts' || file === 'index.ts') return;
  
  let content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
  
  // Skip if already imported
  if (!content.includes('renderEmailHtml')) {
    // Inject import
    content = content.replace("import ", "import { renderEmailHtml } from './email-template';\nimport ");
    
    // Replace body assignment
    // Find the return object: return { subject: ..., body: `...` }
    // Regex to capture subject value and body value
    const replacement = `
        const subject = $1;
        const rawBody = \`$2\`;
        return {
          subject,
          body: renderEmailHtml({ subject, body: rawBody }),
        };`;
        
    // A bit tricky because of varying body contents, so we use string replacement pattern based on our exact standard formatting we wrote earlier
    // Match something like:
    // return {
    //   subject: payload.subject,
    //   body: `Sayın Velimiz/Öğrencimiz,<br><br>${payload.message}`,
    // };
    // or
    // return {
    //   subject: 'Aidat',
    //   body: `...`,
    // };
    
    // Alternative approach since we control the source files completely:
    const regex = /return\s*{\s*subject:\s*(.*?),\s*body:\s*`([\s\S]*?)`,\s*};/;
    content = content.replace(regex, (match, subjectVal, bodyVal) => {
        return `const subjectVal = ${subjectVal};
        const rawBody = \`${bodyVal}\`;
        return {
          subject: subjectVal,
          body: renderEmailHtml({ subject: subjectVal, body: rawBody }),
        };`;
    });
    
    fs.writeFileSync(path.join(workflowsDir, file), content);
    console.log(`Updated ${file}`);
  }
});
