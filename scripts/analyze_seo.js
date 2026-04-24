const https = require('https');

const API_KEY = 'AIzaSyBOACFtHGK0Fe-i3gPn2PbRJTRKZjsPe8E';
const TARGET_URL = 'https://climaticpro.ro';

function runAnalysis(strategy) {
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(TARGET_URL)}&strategy=${strategy}&category=seo&category=performance&category=best-practices&category=accessibility`;

    console.log(`Analyzing ${strategy}...`);

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode !== 200) {
                console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
                console.error(data); // Print error body
                return;
            }

            try {
                const json = JSON.parse(data);
                const categories = json.lighthouseResult.categories;

                console.log(`\n--- ${strategy.toUpperCase()} RESULTS ---`);
                console.log(`Performance: ${categories.performance.score * 100}`);
                console.log(`SEO: ${categories.seo.score * 100}`);
                console.log(`Accessibility: ${categories.accessibility.score * 100}`);
                console.log(`Best Practices: ${categories['best-practices'].score * 100}`);

                console.log('\nTop SEO Issues:');
                const seoAudits = json.lighthouseResult.audits;
                Object.keys(seoAudits).forEach(key => {
                    const audit = seoAudits[key];
                    if (categories.seo.auditRefs.find(r => r.id === key) && audit.score !== 1 && audit.score !== null) {
                        console.log(`- [${audit.title}]: ${audit.displayValue || ''}`);
                    }
                });

                console.log('\nTop Performance Opportunities:');
                const audits = json.lighthouseResult.audits;
                const performanceRefs = categories.performance.auditRefs.filter(r => r.group === 'load-opportunities');
                performanceRefs.forEach(ref => {
                    const audit = audits[ref.id];
                    if (audit.score !== 1 && audit.numericValue > 0) {
                        console.log(`- [${audit.title}]: ${audit.displayValue}`);
                    }
                });

            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        });

    }).on('error', (err) => {
        console.error('Error:', err.message);
    });
}

runAnalysis('mobile');
// runAnalysis('desktop'); // Run sequentially or separate calls manually
