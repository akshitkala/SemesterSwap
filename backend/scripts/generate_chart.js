const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(process.cwd(), 'audit_report.json');
const outputPath = path.resolve(process.cwd(), 'chart.md');

try {
  const rawData = fs.readFileSync(reportPath, 'utf8');
  const results = JSON.parse(rawData);

  let md = '# SemesterSwap System Audit Report\n\n';
  md += `**Date:** ${new Date().toLocaleString()}\n`;
  md += `**Total Checks:** ${results.length}\n`;
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.length - passed;
  
  md += `**Summary:** ${passed} Passed, ${failed} Failed\n\n`;
  
  md += '| Category | Description | Status | Details |\n';
  md += '| :--- | :--- | :---: | :--- |\n';
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    md += `| **${r.category}** | ${r.description} | ${icon} | ${r.details} |\n`;
  });
  
  md += '\n## Detailed Findings\n';
  results.forEach((r, i) => {
      if (r.status === 'FAIL') {
          md += `### ${i+1}. ${r.description} (FAIL)\n`;
          md += `- **Category:** ${r.category}\n`;
          md += `- **Details:** ${r.details}\n`;
          md += `- **Recommendation:** Investigate immediately.\n`;
      }
  });
  
  if (failed === 0) {
      md += '\n🎉 **All systems go! No critical issues found.**\n';
  }

  // Write to backend folder temporarily? Or artifacts?
  // User asked for chart.md artifact.
  // I'll write to local chart.md first then I will use write_to_file to creating artifact from content.
  // Actually, I can just write to the file here, and then read it.
  
  fs.writeFileSync(outputPath, md);
  console.log('chart.md generated successfully.');

} catch (err) {
  console.error('Error generating chart:', err);
}
