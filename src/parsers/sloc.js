// Vendor
import fs from 'fs';

export default function (fileLocation) {
    return new Promise((resolve, reject) => {
        let json = JSON.parse(fs.readFileSync(`${process.cwd()}/${fileLocation}`, 'utf8'));
        if (!json) reject('No SLOC data!');

        let formatted = {};
        formatted.total = json.summary.total;
        formatted.byExt = {};
        Object.keys(json.byExt).forEach(function (key) {
            formatted.byExt[key] = json.byExt[key].summary.total;
        });

        resolve({
            dashboard: formatted,
            report: formatted
        });
    });
};