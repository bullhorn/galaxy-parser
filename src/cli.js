#!/usr/bin/env node
 // Vendor
import program from 'commander';
// APP
import analyze from './analyze';
import dailySlackMessage from './daily-report';

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
    .command('*')
    .action(env => {
        console.log('huh? "%s" is not a valid command', env);
    });

program.parse(process.argv);