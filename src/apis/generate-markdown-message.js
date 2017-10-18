function addEmoji(coverage) {
    if (coverage) {
        return `${coverage.pass ? ':white_check_mark:' : ':bangbang:'} ${coverage.label}`;
    }
    return ':white_check_mark: Pass'
}

function generateMarkdownMessage(data, insertMarker, other) {
    let message = '';
    message += '<!-- Galaxy MR Analyzer: START -->\n\n';
    message += `|File (${data.files.length})|Change (${addEmoji(data.coverage)})|\n`;
    message += '|---|---|\n';
    data.files.forEach(file => {
        if (file.diff) {
            message += `|${file.name}|${addEmoji(file.diff)}|\n`
        }
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