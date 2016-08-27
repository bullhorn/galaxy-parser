// Vendor
import fs from 'fs';

export default function (fileLocation) {
    return new Promise((resolve, reject) => {
        let json = JSON.parse(fs.readFileSync(`${process.cwd()}/${fileLocation}`, 'utf8'));
        if (!json) reject('No ESLINT data!');
        resolve({
            dashboard: {
                warnings: json.warnings,
                errors: json.errors
            },
            report: json
        });
    });
};