// Vendor
import request from 'request';
import Table from 'easy-table';

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
	for (var projectKey in projects) {
		var project = projects[projectKey];

		console.log(JSON.stringify(project.coverage));

		if(project.coverage && project.coverage.current && project.coverage.last) {
			var delta = project.coverage.current - project.coverage.last;
			var higher = delta > 0;
			var symbol = '';
			var health = 'stable';

			if (delta < 0) {
				delta *= -1;
				health = 'poor';
				symbol = '-';
			} else if (delta > 0) {
				health = 'great!'
				symbol = '+';
			}

			table.cell('Project', project.displayName);
			table.cell('Testable Lines (#)', project.coverage.testableLines, leftAlign);
			table.cell('Current (%)', parseFloat(project.coverage.current).toFixed(project.precision), leftAlignPercent);
			table.cell('Highest (%)', parseFloat(project.coverage.highest).toFixed(project.precision), leftAlignPercent);
			table.cell('Delta', symbol + parseFloat(delta).toFixed(project.precision), leftAlignPercent);
			table.cell('Health', health, leftAlign);
			table.newRow()
		}
	}

	// Sort on the coverage
	console.log(JSON.stringify(table));
	table.sort(['Current (%)|des']);
	return '```' + table.toString() + '```';
}

/**
 * Get the slack message for the summary
 */
function getMessage(projects) {
	var message = '*<http://metrics:9002|Daily Galaxy Report - Bullhorn Code Coverage Metrics>*\n';
	message += getProjectTable(projects);
	message += '\n_Want your project on here? Consult the <https://github.com/jgodi/galaxy-parser/blob/master/README.md|Galaxy Parser> to learn how!_';
	message += '\n_Is your project missing? Contact Joshua Godi for assistance_';
	return message;
}

export default function (FIREBASE_URL, SLACK_HOOK, SLACK_CHANNEL) {
	// Make sure that we have a firebase url passed in
	if (!FIREBASE_URL) {
		console.error('[Galaxy Parser]: firebase url was not supplied. Please follow instructions inside README.md');
		return true;
	}

	// Get core-services dashboard and make a status report to slack
	request('https://' + FIREBASE_URL + '/projects/core-services-coverage-reporter.json', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var projects = JSON.parse(body);

			// If a slack hook/channel was supplied, send a message based on trend/stats only if we have a last run
			if (SLACK_HOOK && SLACK_CHANNEL) {
				// Create a slack message based on the results
				var message = {
					text: getMessage(projects),
					channel: SLACK_CHANNEL,
					username: 'Galaxy',
					icon_url: 'https://67.media.tumblr.com/avatar_975d849db99f_128.png'
				};
				request.post('https://hooks.slack.com/services/' + SLACK_HOOK, {
					json: message
				});
			}
		} else {
			console.error('[Daily Report] Error:', error);
		}
	});
}
