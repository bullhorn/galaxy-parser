function generateMarkdownMessage(data) {
    let message = '';
    message += `#### Overall Coverage Change: ${data.coverage}\n`;
    message += '|File|Change|\n';
    message += '|---|---|\n';
    data.files.forEach(file => {
        message += `|${file.name}|${file.diff}|\n`
    });
    message += '\n*Please note, individual file changes won\'t add up to the overall coverage due to number of lines!*'
    return message;
}

export default generateMarkdownMessage;