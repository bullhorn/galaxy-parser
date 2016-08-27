// Vendor
import request from 'request';
import Table from 'easy-table';
import jsonfile from 'jsonfile';

// File path for last run
const LAST_RUN_FILE = 'last-run.json';

/**
 * Print for the table, formats percent and padLefts it
 */
function formatPercent(val, width) {
    var str = val.toFixed(2) + '%';
    return width ? str : Table.padLeft(str, width);
}

/**
 * Print for the table, left-aligns the value
 */
function leftAlign(val, width) {
    return Table.padLeft(val, width);
}

/**
 * Print for the table, formats percent and padLefts it
 */
function leftAlignPercent(val, width) {
    return Table.padLeft(val + '%', width);
}

/**
 * Create the table for the daily report
 */
function getProjectTable(projects) {
    var table = new Table();

    // Setup the table
    projects.forEach(project => {
        table.cell('Project', project.name.replace('novo-', '').toUpperCase());
        table.cell('Unit Test Coverage', Number(project.coverage.lines.percent), leftAlignPercent);
        table.cell('Delta', project.coverageTrend || '0.00', leftAlignPercent);
        if (project.eslint) {
            table.cell('Linting', project.eslint.warnings + project.eslint.errors, leftAlign);
        } else {
            table.cell('Linting', '-', leftAlign);
        }
        table.newRow()
    });

    // Create the avg for coverage
    table.total('Unit Test Coverage', {
        printer: Table.aggr.printer('Avg: ', formatPercent),
        reduce: Table.aggr.avg,
        init: 0
    });

    // Sort on the coverage
    table.sort(['Unit Test Coverage|des']);
    return '```' + table.toString() + '```';
}

/**
 * Get the slack message for the summary
 */
function getMessage(projects) {
    var message = '*<http://metrics:9002|Daily Galaxy Report>*\n';
    message += getProjectTable(projects);
    message += '\n_Want your project on here, contact <@jgodi> to learn how!_';
    return message;
}

export default function (FIREBASE_URL, SLACK_HOOK, SLACK_CHANNEL) {
    // Make sure that we have a firebase url passed in
    if (!FIREBASE_URL) {
        console.error('[Galaxy Parser]: firebase url was not supplied. Please follow instructions inside README.md');
        return true;
    }

    // Get all the dashboards and make a status report to slack
    request('https://' + FIREBASE_URL + '/dashboard.json', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var projects = JSON.parse(body);
            var lastRun;

            // Try to load the last-run.json file
            try {
                lastRun = jsonfile.readFileSync(LAST_RUN_FILE);
            } catch (e) {
                // no op
            }

            // Get trends
            if (lastRun) {
                for (var key in lastRun) {
                    if (lastRun.hasOwnProperty(key)) {
                        if (projects[key]) {
                            var lastCoverage = lastRun[key].coverage.lines.percent;
                            var newCoverage = projects[key].coverage.lines.percent;
                            if (lastCoverage > newCoverage) {
                                projects[key].coverageTrend = '-' + (lastCoverage - newCoverage).toFixed(2);
                            } else if (newCoverage > lastCoverage) {
                                projects[key].coverageTrend = '+' + (newCoverage - lastCoverage).toFixed(2);
                            } else {
                                projects[key].coverageTrend = '0.00';
                            }
                        }
                    }
                }
            }

            // Convert to an array
            var projectArray = [];
            for (var key in projects) {
                if (projects.hasOwnProperty(key)) {
                    projects[key].name = key;
                    projectArray.push(projects[key]);
                }
            }

            // If a slack hook/channel was supplied, send a message based on trend/stats only if we have a last run
            if (SLACK_HOOK && SLACK_CHANNEL) {
                // Create a slack message based on the results
                var message = {
                    text: getMessage(projectArray),
                    channel: SLACK_CHANNEL,
                    username: 'Galaxy',
                    icon_url: 'https://67.media.tumblr.com/avatar_975d849db99f_128.png'
                };
                request.post('https://hooks.slack.com/services/' + SLACK_HOOK, { json: message });
            }

            // Save the results to get trends
            jsonfile.writeFileSync(LAST_RUN_FILE, projects, { spaces: 2 });
        } else {
            console.error('[Daily Report] Error:', error);
        }
    });
}