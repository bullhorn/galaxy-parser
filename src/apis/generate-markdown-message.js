function addEmoji(label, pass) {
    return `${pass ? ':white_check_mark:' : ':bangbang:'} ${label}`;
}

function generateMarkdownMessage(data, insertMarker, other) {
    let message = '';
    message += '<!-- Galaxy MR Analyzer: START -->\n\n';
    message += `|File (${data.files.length})|Change (${addEmoji(data.coverage.label, data.coverage.pass)})|\n`;
    message += '|---|---|\n';
    data.files.forEach(file => {
        message += `|${file.name}|${addEmoji(file.diff.label, file.diff.pass)}|\n`
    });
    message += '\n*Please note, individual file changes won\'t add up to the overall coverage due to number of lines!*\n';
    message += '\n**All new files must be at 80% coverage and old files must NOT decrease in coverage!**\n';
    if (other) {
        message += other;
    }
    message += '\n\n<!-- Galaxy MR Analyzer: END -->';
    return message;
}

export default generateMarkdownMessage;