// Vendor
import request from 'request';
import simpleGit from 'simple-git';
// APP
import parse from './parse';
import formatSlackMessage from './format-slack';

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
 * Gets the last commit of the project
 */
async function getLastCommit() {
    return new Promise((resolve, reject) => {
        simpleGit().log((err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data ? data.latest : {});
        });
    });
}

/**
 * Checks to make sure the two builds differ enough to send slack messages
 */
function deltaCheck(projectData) {
    // If the coverage is still below the max, show
    if (projectData.coverage.highest > projectData.coverage.current) {
        return true;
    }
    var diff = projectData.coverage.current - projectData.coverage.last;
    if (diff < 0) diff *= -1;
    console.log(`[Galaxy Parser]: Results differ by ${diff}%${diff >= projectData.threshold ? ', posting slack message' : ', skipping slack message'}`);
    return diff >= projectData.threshold;
}

async function analyze(FIREBASE_URL, SLACK_HOOK, SLACK_CHANNEL) {
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

    try {
        // Get the project data
        let projectData = await getProjectData(packageJSON.name, FIREBASE_URL);
        // Get the last commit
        let lastCommit = await getLastCommit();
        // Parse the new results
        let parsed = await parse(GALAXY_SETTINGS.locations, false);

        // Default some data if this is the first run
        if (!projectData) {
            projectData = {
                lines: {
                    current: 0,
                    history: []
                },
                coverage: {
                    current: 0,
                    highest: 0,
                    history: []
                },
                byModule: {}
            };
        }

        // Set the data
        // Base
        projectData.key = packageJSON.name;
        projectData.displayName = GALAXY_SETTINGS.display || packageJSON.name;
        projectData.url = packageJSON.repository && packageJSON.repository.url ? packageJSON.repository.url.replace('.git', '') : '';
        projectData.threshold = GALAXY_SETTINGS.threshold || 0;
        projectData.goal = GALAXY_SETTINGS.goal || 80;
        projectData.type = GALAXY_SETTINGS.type || 'unknown';
        projectData.public = GALAXY_SETTINGS.public || false;
        projectData.precision = GALAXY_SETTINGS.precision || 2;
        // Timestamp
        projectData.timestamp = Date.now();
        // Commit
        projectData.commit = {
            hash: lastCommit.hash,
            date: lastCommit.date,
            message: lastCommit.message,
            author: {
                name: lastCommit.author_name,
                email: lastCommit.author_email
            }
        };
        // Lines
        if (parsed.totals.sloc) {
            projectData.lines = {
                current: parsed.totals.sloc.total,
                last: projectData.lines.current,
                breakdown: parsed.totals.sloc.byExt,
                history: projectData.lines.history.concat([
                    [Date.now(), parsed.totals.sloc.total]
                ])
            };
        } else {
            delete projectData.lines;
        }
        // Coverage
        projectData.coverage = {
            testableLines: parsed.totals.coverage.lines.found,
            current: parsed.totals.coverage.lines.percent,
            last: projectData.coverage.current,
            highest: parsed.totals.coverage.lines.percent > projectData.coverage.highest ? parsed.totals.coverage.lines.percent : projectData.coverage.highest,
            history: projectData.coverage.history.concat([
                [Date.now(), parsed.totals.coverage.lines.percent]
            ])
        }
        // By Module
        if (parsed.byModule) {
            projectData.byModule = parsed.byModule;
            for (var submodule in projectData.byModule.coverage) {
                projectData.byModule.coverage[submodule].coverage = {
                    last: projectData.byModule.coverage[submodule].totals.lines.percent,
                    highest: parsed.byModule.coverage[submodule].totals.lines.percent > projectData.byModule.coverage[submodule].coverage.highest ? parsed.byModule.coverage[submodule].totals.lines.percent : projectData.byModule.coverage[submodule].coverage.highest
                }
            }
        } else {
            delete projectData.byModule;
        }
        // Files
        projectData.files = parsed.files.coverage;
        // Upload to firebase
        // Send the project back to firebase
        console.log('[Galaxy Parser] - Pushing %j', projectData);
        request.put('https://' + FIREBASE_URL + '/projects/' + packageJSON.name + '.json', {
            json: projectData
        }, (error, response, body) => {
            if (error || body.error) {
                console.error('[Galaxy Parser]: HTTP ERROR', error || body.error);
            }
        });

        // Send Slack Messages
        if (SLACK_HOOK && SLACK_CHANNEL && deltaCheck(projectData)) {
            // Create a slack message based on the results
            var message = {
                text: `New results for <http://metrics:9002/#/${packageJSON.name}|${projectData.displayName}>, triggered by *${projectData.commit.author.name}*`,
                channel: SLACK_CHANNEL,
                username: 'Galaxy',
                attachments: formatSlackMessage(projectData),
                icon_url: 'https://67.media.tumblr.com/avatar_975d849db99f_128.png'
            };
            request.post('https://hooks.slack.com/services/' + SLACK_HOOK, {
                json: message
            });
        } else {
            console.log(`[Galaxy Parser]: Report does not differentiate enough (+/- ${projectData.threshold}) to send slack messages!`);
        }
    } catch (e) {
        console.log('[Galaxy Parser]: ERROR', e);
    }
    return true;
}

export default analyze;