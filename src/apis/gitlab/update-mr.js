// Vendor
import gitlab from 'node-gitlab';
// APP
import generateMarkdownMessage from '../generate-markdown-message';

async function updateMR(data, branch, url, gitlabProjectId, apiKey) {
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
        client.mergeRequests.createNote({
            id: gitlabProjectId,
            merge_request_id: mr.id,
            body: generateMarkdownMessage(data)
        });
        let newLabel = '';
        // TODO - also check for new files with less then 80%
        if (data.coverage.indexOf('-') !== -1) {
            newLabel = 'Failed: Code Coverage';
        } else {
            newLabel = 'Pass: Code Coverage';
        }
        client.mergeRequests.update({
            id: gitlabProjectId,
            merge_request_id: mr.id,
            labels: mr.labels ? mr.labels.join(',') + `,${newLabel}` : newLabel
        });
    } else {
        console.error('[Galaxy Parser]: Unable to find MR for', branch);
    }
}

export default updateMR;