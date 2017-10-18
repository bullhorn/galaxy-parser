// Vendor
import gitlab from 'node-gitlab';
// APP
import generateMarkdownMessage from '../generate-markdown-message';

function replaceComment(description, data) {
    let start = description.indexOf('<!-- Galaxy MR Analyzer: START -->');
    let end = description.indexOf('<!-- Galaxy MR Analyzer: END -->') - 1;
    let endLength = '<!-- Galaxy MR Analyzer: END -->'.length;
    let newDescription = description.substring(0, start, end + endLength);
    return newDescription + '\n' + generateMarkdownMessage(data, true);
}

function generateDescription(description, data) {
    if (data.files.length > 0) {
        if (description.includes('<!-- Galaxy MR Analyzer: START -->')) {
            return replaceComment(description, data);
        } else {
            return description + '\n\n' + generateMarkdownMessage(data, true);
        }
    }
    return description;
}

async function updateMR(data, branch, url, gitlabProjectId, apiKey, hasI18nFile) {
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
        let failingFiles = data.files.filter(file => !file.diff.pass);
        let description = generateDescription(mr.description, data);
        let passCoverage = data.coverage.pass && failingFiles.length === 0;
        let labels = [];
        let otherLabels = mr.labels.filter(label => !['Working: Dev', 'Working: QA', 'Pass: QA', 'Pass: Code Coverage', 'Failed: Code Coverage', 'Has Translations', 'Dev Work Complete', 'Pass: Dev'].includes(label));

        if (mr.labels.length > 0) {
            let checkLabels = {
                dev: 'Working: Dev',
                qa: 'Working: QA'
            }
            mr.labels.forEach(label => {
                if (label === 'Working: Dev' || label === 'Dev Work Complete' || label === 'Pass: Dev') {
                    checkLabels.dev = label;
                } else if (label === 'Working: QA' || label === 'Pass: QA') {
                    checkLabels.qa = label;
                }
            });

            labels = [checkLabels.dev, checkLabels.qa];
        } else {
            labels = ['Working: Dev', 'Working: QA'];
        }

        if (hasI18nFile) {
            labels.push('Has Translations');
        }
        if (passCoverage) {
            labels.push('Pass: Code Coverage');
        } else {
            labels.push('Failed: Code Coverage');
        }

        labels.push(...otherLabels);

        client.mergeRequests.update({
            id: gitlabProjectId,
            merge_request_id: mr.id,
            description: description,
            labels: labels.join(',')
        }).then((response) => {
            console.log('[Galaxy Parser]: Update MR Success!');
        }).catch((err) => {
            throw err;
        });
    } else {
        console.error('[Galaxy Parser]: Unable to find MR for', branch);
    }
}

export default updateMR;