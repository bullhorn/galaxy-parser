// Vendor
import gitlab from 'node-gitlab';
// APP
import generateMarkdownMessage from '../generate-markdown-message';

function replaceComment(description, data, suitesToRun) {
    let start = description.indexOf('<!-- Galaxy MR Analyzer: START -->');
    let end = description.indexOf('<!-- Galaxy MR Analyzer: END -->') - 1;
    let endLength = '<!-- Galaxy MR Analyzer: END -->'.length;
    let newDescription = description.substring(0, start, end + endLength);
    return newDescription + '\n' + generateMarkdownMessage(data, true, suitesToRun);
}

function generateDescription(description, data, automationSuitesToRun) {
    let suitesToRun = '';
    if (automationSuitesToRun.length !== 0) {
        suitesToRun += '#### Recommended Automation Suites';
        suitesToRun += '\nBased on the changes you have pushed, you should run the following automation suites on your box:\n';
        automationSuitesToRun.forEach(automation => {
            suitesToRun += `* [${automation.suite}](${automation.link})\n`
        });
    }
    if (description.includes('<!-- Galaxy MR Analyzer: START -->')) {
        return replaceComment(description, data, suitesToRun);
    } else {
        return description + '\n\n' + generateMarkdownMessage(data, true, suitesToRun);
    }
}

async function updateMR(data, branch, url, gitlabProjectId, apiKey, automationSuitesToRun) {
    const client = gitlab.createPromise({
        api: url,
        privateToken: apiKey,
        requestTimeout: 10000
    });

    let mrs = await client.mergeRequests.list({
        id: gitlabProjectId,
        per_page: 100,
        state: 'opened'
    });
    // Find the MR that goes with this branch
    let mr = mrs.find((m => {
        return m.source_branch === branch
    }));

    if (mr) {
        console.error('[Galaxy Parser]: creating comment on MR');
        let newLabel = '';
        let failingFiles = data.files.filter(file => !file.diff.pass);
        if (!data.coverage.pass || failingFiles.length !== 0) {
            newLabel = 'Failed: Code Coverage';
        } else {
            newLabel = 'Pass: Code Coverage';
        }
        if (mr.labels.indexOf('Failed: Code Coverage')) {
            mr.labels.splice(mr.labels.indexOf('Failed: Code Coverage'), 1);
        }
        if (mr.labels.indexOf('Pass: Code Coverage')) {
            mr.labels.splice(mr.labels.indexOf('Pass: Code Coverage'), 1);
        }
        if (mr.labels.includes('Failed: Code Coverage'))
            client.mergeRequests.update({
                id: gitlabProjectId,
                merge_request_id: mr.id,
                description: generateDescription(mr.description, data, automationSuitesToRun),
                labels: mr.labels ? mr.labels.join(',') + `,${newLabel}` : newLabel
            });
    } else {
        console.error('[Galaxy Parser]: Unable to find MR for', branch);
    }
}

export default updateMR;