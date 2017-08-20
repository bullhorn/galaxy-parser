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

		for (var submodule in project.coverage) {
			table.cell('Project', submodule.replace(/-/g, ' ').toLowerCase().split(' ').map(function (word) {
				return word.replace(word[0], word[0].toUpperCase());
			}).join(' '));
			table.cell('Testable Lines (#)', project.coverage[submodule].totals.lines.found, leftAlign);
			table.cell('Current (%)', parseFloat(project.coverage[submodule].totals.lines.percent), leftAlignPercent);
			table.newRow()
		}
	}
	// Sort on the coverage
	table.sort(['Testable Lines (#)|des']);
	return '```' + table.toString() + '```';
}

/**
 * Get the slack message for the summary
 */
function getMessage(projects) {
	var message = '*<http://metrics:9002|Daily Core Services Submodule Report - Bullhorn Code Coverage Metrics>*\n';
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
