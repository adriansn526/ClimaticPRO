const fs = require('fs');

try {
    const report = JSON.parse(fs.readFileSync('report.json', 'utf8'));

    const scores = {
        Performance: report.categories.performance?.score * 100,
        Accessibility: report.categories.accessibility?.score * 100,
        "Best Practices": report.categories['best-practices']?.score * 100,
        SEO: report.categories.seo?.score * 100,
    };

    const metrics = {
        "First Contentful Paint": report.audits['first-contentful-paint']?.displayValue,
        "Speed Index": report.audits['speed-index']?.displayValue,
        "Largest Contentful Paint": report.audits['largest-contentful-paint']?.displayValue,
        "Total Blocking Time": report.audits['total-blocking-time']?.displayValue,
        "Cumulative Layout Shift": report.audits['cumulative-layout-shift']?.displayValue,
    };

    console.log('### Lighthouse Scores');
    Object.entries(scores).forEach(([key, value]) => {
        console.log(`- **${key}**: ${value ? value.toFixed(0) : 'N/A'}`);
    });

    console.log('\n### Key Metrics');
    Object.entries(metrics).forEach(([key, value]) => {
        console.log(`- **${key}**: ${value || 'N/A'}`);
    });

} catch (err) {
    console.error('Error parsing report:', err);
}
