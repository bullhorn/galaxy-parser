// Vendor
import request from 'request';
import simpleGit from 'simple-git';
import path from 'path';
// APP
import parse from './parse';
import updatePR from './apis/github/update-pr';
import updateMR from './apis/gitlab/update-mr';

// Package.JSON
let packageJSON = require(`${process.cwd()}/package.json`);
const GALAXY_SETTINGS = packageJSON.galaxy;

/**
 * Get the project's data
 */
async function getProjectData(name, FIREBASE_URL) {
    return new Promise((resolve, reject) => {
        request(`https://${FIREBASE_URL}/projects/${name}.json`, (err, res, body) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(JSON.parse(body));
        });
    });
}

/**
 * Gets the git diff for the branch
 */
async function getGitDiff(base, current, api) {
    let b = api === 'gitlab' ? `remotes/origin/${base}` : 'HEAD';
    let c = api === 'gitlab' ? `remotes/origin/${current}` : base;
    return new Promise((resolve, reject) => {
        console.error('[Galaxy Parser]: comparing branches', b, c);
        simpleGit().getRemotes(true, (err, data) => {
            console.log('REMOTE', data);
        });
        simpleGit().diffSummary([b, c], (err, data) => {
            if (err) {
                throw err;
            }
            console.log('DIFF', data);
            resolve(data ? data : {});
        });
    });
}

function getDiffLabel(current, last) {
    if (last === 0) {
        return {
            label: `+${current}%`,
            pass: current >= 80
        };
    } else if (last > current) {
        return {
            label: `-${Number(last - current).toFixed(GALAXY_SETTINGS.precision || 2)}%`,
            pass: false
        };
    } else if (current > last) {
        return {
            label: `+${Number(current - last).toFixed(GALAXY_SETTINGS.precision || 2)}%`,
            pass: true
        };
    } else {
        return {
            label: 'No Change',
            pass: true
        };
    }
}

async function analyze(BRANCH, FIREBASE_URL, SLACK_HOOK, SLACK_CHANNEL, API_KEY) {
    // Make sure that we have galaxy configured in the package.json
    if (!GALAXY_SETTINGS) {
        console.error('[Galaxy Parser]: "galaxy" section not present in package.json. Please follow instructions inside README.md');
        return true;
    }

    // Make sure that we have a firebase url passed in
    if (!FIREBASE_URL) {
        console.error('[Galaxy Parser]: firebase url was not supplied. Please follow instructions inside README.md');
        return true;
    }

    if (!BRANCH) {
        console.error('[Galaxy Parser]: branch was not supplied. Please follow instructions inside README.md');
        return true;
    }

    if (!GALAXY_SETTINGS.defaultBranch) {
        console.error('[Galaxy Parser]: defaultBranch was not supplied. Please follow instructions inside README.md');
        return true;
    }

    try {
        // Get the data from the last run
        let lastRun = await getProjectData(packageJSON.name, FIREBASE_URL);
        // Parse the new results
        let currentRun = await parse(GALAXY_SETTINGS.locations, true);
        // Get the git diff for this branch
        let gitDiff = await getGitDiff(GALAXY_SETTINGS.defaultBranch, BRANCH, GALAXY_SETTINGS.api);

        // Get a list of files that changes
        let changedFiles = [];
        let fullPathChangedFiles = [];
        if (gitDiff.files) {
            changedFiles = gitDiff.files.map(diff => path.basename(diff.file));
            fullPathChangedFiles = gitDiff.files.map(diff => diff.file);
        }

        let overallCompare = {
            coverage: getDiffLabel(currentRun.totals.coverage.lines.percent, lastRun.coverage.current),
            files: []
        };

        // Compare the current file coverage to the last run
        // Map the files from lastRun and currentRun into objects to make things easier
        let lastRunData = {};
        let currentRunData = {};
        if (lastRun.files) {
            lastRun.files.forEach(file => {
                lastRunData[file.file] = {
                    lines: file.lines,
                    branches: file.branches,
                    functions: file.functions
                }
            });
        }
        currentRun.files.coverage.forEach(file => {
            currentRunData[file.file] = {
                lines: file.lines,
                branches: file.branches,
                functions: file.functions
            }
        });
        changedFiles.forEach(file => {
            if (lastRunData[file] || currentRunData[file]) {
                let last = lastRunData[file] ? Number(lastRunData[file].lines) : 0;
                let current = currentRunData[file] ? Number(currentRunData[file].lines) : 0;
                overallCompare.files.push({
                    name: file,
                    diff: currentRunData[file] ? getDiffLabel(current, last) : {
                        label: 'Deleted',
                        pass: true
                    }
                });
            }
        });

        console.log('[Galaxy Parser]: Compare Data %j', overallCompare);

        if (GALAXY_SETTINGS.api === 'github') {
            updatePR(overallCompare, BRANCH, GALAXY_SETTINGS.owner, GALAXY_SETTINGS.repo, API_KEY);
        } else if (GALAXY_SETTINGS.api === 'gitlab') {
            let automationSuitesToRun = [];
            if (GALAXY_SETTINGS.automationSuites && GALAXY_SETTINGS.automationSuites.length !== 0) {
                let changedFilesString = fullPathChangedFiles.join(',');
                GALAXY_SETTINGS.automationSuites.forEach(suite => {
                    if (changedFilesString.includes(suite.test)) {
                        automationSuitesToRun.push(suite);
                    }
                });
            }
            updateMR(overallCompare, BRANCH, GALAXY_SETTINGS.gitlabApiUrl, GALAXY_SETTINGS.gitlabProjectId, API_KEY, automationSuitesToRun);
        } else {
            console.log('[Galaxy Parser]: Invalid API -- cannot update MR/PR', GALAXY_SETTINGS.api);
        }
    } catch (e) {
        console.log('[Galaxy Parser]: ERROR', e);
    }
    return true;
}

export default analyze;