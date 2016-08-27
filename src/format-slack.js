// Colors for the attachment border
const COLORS = {
    down: '#c00',
    up: '#004c00',
    same: '#ccc'
};

// Get the color based on the value
function getColor(current, last) {
    if (current > last) return COLORS.up;
    if (current < last) return COLORS.down;
    return COLORS.same;
}

// Get the slack message
function getText(current, last, coverage, goalSetting) {
    var goal = goalSetting || 80;
    var message = current;
    if (coverage) message += '%';

    var difference = (current - last).toFixed(2);
    if (difference < 0) difference *= -1;

    if (current !== last) {
        message += '\t-\t';
        if (current > last) message += ':arrow_up: ';
        if (current < last) message += ':arrow_down: ';
        message += difference;
        if (coverage) {
            message += '%';
            if (current < goal) {
                message += '\t-\t:warning: ';
                message += (goal - current).toFixed(2);
                message += '%';
                message += ' left to goal (' + goal + '%) :warning:'
            }
        }
    }

    return message;
}

// Format a slack message
export default function (current, last, goalSetting) {
    var messages = [];

    // Coverage
    messages.push({
        color: getColor(current.coverage.lines.percent, last.coverage.lines.percent),
        fields: [
            {
                title: 'Unit Test Coverage',
                value: getText(current.coverage.lines.percent, last.coverage.lines.percent, true, goalSetting)
            }
        ]
    });

    // Linting
    if (last.eslint && current.eslint) {
        messages.push({
            color: getColor(last.eslint.errors + last.eslint.warnings, current.eslint.errors + current.eslint.warnings),
            fields: [
                {
                    title: 'Lint Warnings/Errors',
                    value: getText(current.eslint.errors + current.eslint.warnings, last.eslint.errors + last.eslint.warnings, false, goalSetting)
                }
            ]
        });
    }
    return messages;
};
