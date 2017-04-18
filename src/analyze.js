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
 * Gets the last run of the project
 */
async function getLastRun(name, FIREBASE_URL) {
    return new Promise((resolve, reject) => {
        request(`https://${FIREBASE_URL}/dashboard/${name}.json`, (err, res, body) => {
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
function deltaCheck(current, last, threshold) {
    if (!last) {
        console.log('[Galaxy Parser]: No previous results, skipping slack message');
        return false;
    }
    // If there is no threshold, then set to 0 to report all changes!
    var deltaThreshold = threshold || 0;
    var diff = Math.abs(current.coverage.lines.percent - last.coverage.lines.percent);
    console.log(`[Galaxy Parser]: Results differ by ${diff}%${diff >= deltaThreshold ? ', posting slack message' : ', skipping slack message'}`);
    return diff >= deltaThreshold;
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
        // Get the last run
        let lastRun = await getLastRun(packageJSON.name, FIREBASE_URL);
        // Get the last commit
        let lastCommit = await getLastCommit();
        // Parse the new results
        let parsed = await parse(GALAXY_SETTINGS.locations);

        // Only happens on the first run, so lefts defalt lastRun if null
        if (!lastRun) {
            lastRun = {
                coverage: {
                    lines: {
                        percent: 0
                    }
                },
                eslint: {
                    warnings: 0,
                    errors: 0
                }
            };
        }

        // Modify the parsed report
        // Set the name
        parsed.dashboard.displayName = GALAXY_SETTINGS.display || packageJSON.name;
        parsed.report.displayName = GALAXY_SETTINGS.display || packageJSON.name;
        // Set the last commit
        parsed.dashboard.commit = lastCommit;
        parsed.report.commit = lastCommit;
        // Set the type
        parsed.dashboard.type = GALAXY_SETTINGS.type;
        parsed.report.type = GALAXY_SETTINGS.type;
        // Set the url
        parsed.dashboard.url = packageJSON.repository.url;

        // Upload to firebase
        // Send the dashboard to firebase
        request.put('https://' + FIREBASE_URL + '/dashboard/' + packageJSON.name + '.json', {
            json: parsed.dashboard
        });
        // Send the report to firebase
        request.post('https://' + FIREBASE_URL + '/' + packageJSON.name + '.json', {
            json: parsed.report
        });

        // Send Slack Messages
        if (SLACK_HOOK && SLACK_CHANNEL && deltaCheck(parsed.dashboard, lastRun, GALAXY_SETTINGS.threshold)) {
            // Create a slack message based on the results
            var message = {
                text: `New results for <http://metrics:9002/#/project/${packageJSON.name}|${parsed.dashboard.displayName}>, triggered by *${lastCommit.author_name}*`,
                channel: SLACK_CHANNEL,
                username: 'Galaxy',
                attachments: formatSlackMessage(parsed.dashboard, lastRun, GALAXY_SETTINGS.threshold),
                icon_url: 'https://67.media.tumblr.com/avatar_975d849db99f_128.png'
            };
            request.post('https://hooks.slack.com/services/' + SLACK_HOOK, {
                json: message
            });
        } else {
            console.log('[Galaxy Parser]: Report does not differentiate enough to send slack messages!');
        }
    } catch (e) {
        console.log('[Galaxy Parser]: ERROR', e);
    }
    return true;
}

export default analyze;