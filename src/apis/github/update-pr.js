// Vendor
import GitHubApi from 'github';
// APP
import generateMarkdownMessage from '../generate-markdown-message';

const github = new GitHubApi();

async function updatePR(data, branch, owner, repo, apikey) {
    // TODO - make github app
    await github.authenticate({
        type: 'oauth',
        token: apikey
    });

    let prs = await github.pullRequests.getAll({
        owner: owner,
        repo: repo,
        state: 'open',
        head: branch
    });
    if (prs.data.length > 0) {
        let number = prs.data[0].number;
        github.issues.createComment({
            owner: owner,
            repo: repo,
            number: number,
            body: generateMarkdownMessage(data)
        });
    } else {
        console.error('[Galaxy Parser]: Unable to find PR for', branch);
    }
}

export default updatePR;