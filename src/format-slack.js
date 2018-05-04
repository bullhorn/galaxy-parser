// Colors for the attachment border
const COLORS = {
  down: '#c00',
  up: '#004c00',
  same: '#ccc',
};

// Get the color based on the value
function getColor(current, last, highest) {
  if (highest > current) return COLORS.down;
  if (current > last) return COLORS.up;
  if (current < last) return COLORS.down;
  return COLORS.same;
}

// Get the slack message
function getText(current, last, highest, precision) {
  var message = parseFloat(current).toFixed(precision);
  message += '%';
  var difference = parseFloat(current - last).toFixed(precision);
  if (difference < 0) difference *= -1;
  if (current !== last || highest > current) {
    message += '\t-\t';
    if (current > last && current > highest) message += ':arrow_up: ';
    if (current < last || current < highest) message += ':arrow_down: ';
    if (highest > current) {
      difference = highest - current;
      message += parseFloat(difference).toFixed(precision);
      message += '% still behind the highest coverage ever (' + highest + '%) :warning:';
    } else {
      message += parseFloat(difference).toFixed(precision);
      message += '%';
      if (current > last) {
        message += '\t-\t:partyparrot: NEW HIGH SCORE! :aussie_parrot:';
      } else {
        message += '\t-\t:crying_cat_face: Oh no.. REVERT! REVERT!';
      }
    }
  }

  return message;
}

// Format a slack message
export default function(projectData) {
  var messages = [];

  // Coverage
  messages.push({
    color: getColor(projectData.coverage.current, projectData.coverage.last, projectData.coverage.highest),
    fields: [
      {
        title: 'Coverage (%)',
        value: getText(projectData.coverage.current, projectData.coverage.last, projectData.coverage.highest, projectData.precision),
      },
    ],
  });
  return messages;
}
