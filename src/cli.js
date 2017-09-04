#!/usr/bin/env node
 // Vendor
import program from 'commander';
// APP
import analyze from './analyze';
import dailySlackMessage from './daily-report';
import dailyCSMessage from './daily-submodule';
import analyzeMr from './analyze-mr';

program
    .version('1.0.0');

program
    .command('analyze [firebase] [slackHook] [slackChannel]')
    .description('Analyze code for Galaxy')
    .action((...args) => {
        analyze(args[0], args[1], args[2]);
    });

program
    .command('daily-report [firebase] [slackHook] [slackChannel]')
    .description('Daily report for Galaxy into Slack')
    .action((...args) => {
        dailySlackMessage(args[0], args[1], args[2]);
    });

program
	.command('cs-report [firebase] [slackHook] [slackChannel]')
	.description('Daily report for cs into Slack')
	.action((...args) => {
		dailyCSMessage(args[0], args[1], args[2]);
	});

program
    .command('analyze-mr [branch] [firebase] [slackHook] [slackChannel] [apiKey]')
    .description('Analyze a MR')
    .action((...args) => {
        analyzeMr(args[0], args[1], args[2], args[3], args[4]);
    });

program
    .command('*')
    .action(env => {
        console.log('huh? "%s" is not a valid command', env);
    });

program.parse(process.argv);