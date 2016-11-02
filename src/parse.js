// APP
import lcov from './parsers/lcov';
import jacoco from './parsers/jacoco';
import jacocoMulti from './parsers/jacoco-multi';
import eslint from './parsers/eslint';
import sloc from './parsers/sloc';

async function parse(locations) {
    let dashboard = {};
    let report = {};

    try {
        await Promise.all(Object.keys(locations).map(async function (location) {
            let result;
            let key = location;

            // Parse each of the sections
            switch (location) {
                case 'lcov':
                    result = await lcov(locations[location]);
                    break;
                case 'jacoco':
                    result = await jacoco(locations[location]);
                    break;
                case 'jacoco-multi':
                    result = await jacocoMulti(locations[location]);
                    break;
                case 'eslint':
                    result = await eslint(locations[location]);
                    break;
                case 'sloc':
                    result = await sloc(locations[location]);
                    break;
                default:
                    console.error(`Parser not found for ${location}! Make sure to create one and import it here!`);
            }

            // Remap the key to "coverage" if lcov or jacoco
            if (location === 'lcov' || location === 'jacoco' || location === 'jacoco-multi') {
                key = 'coverage';
            }

            if (result) {
                dashboard[key] = result.dashboard;
                report[key] = result.report;
            }
        }));
    } catch (e) {
        console.log(e);
    }

    return { dashboard, report };
}

export default parse;