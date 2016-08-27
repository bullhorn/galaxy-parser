'use strict';
var argv = require('yargs').argv;

function stripPath(filePath) {
    var cwd = process.cwd();
    var folders = argv['_'];

    var ret = filePath.replace(cwd, '');
    for (var i = 0; i < folders.length; i++) {
        ret = ret.replace(folders[i], '');
    }
    return ret.replace(/^(\/)/, '');
}

module.exports = function (results) {
    var results = results || [];
    // accumulate the errors and warnings
    var summary = results.reduce(function (seq, current) {
        seq.errors += current.errorCount;
        seq.warnings += current.warningCount;


        if (current.messages.length) {
            var message = {};
            message.file = stripPath(current.filePath);
            message.messages = current.messages;
            seq.files.push(message);
        }

        return seq;
    }, { errors: 0, warnings: 0, files: [] });

    return JSON.stringify({
        errors: summary.errors,
        warnings: summary.warnings,
        messages: summary.files
    }, function (key, val) {
        // filter away the Esprima AST
        if (key !== 'node') {
            return val;
        }
    });
};
