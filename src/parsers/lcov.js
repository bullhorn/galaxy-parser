// Vendor
import parse from 'lcov-parse';
// APP
import getTotals from './utils/get-totals';

export default function (fileLocation) {
    return new Promise((resolve, reject) => {
        parse(`${process.cwd()}/${fileLocation}`, (err, data) => {
            if (err) reject(err);
            resolve(getTotals(data));
        })
    });
};