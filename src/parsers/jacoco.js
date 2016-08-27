// APP
import parse from './utils/jacoco-parse';
import getTotals from './utils/get-totals';

export default function (fileLocation) {
    return new Promise((resolve, reject) => {
        parse(`${process.cwd()}/${fileLocation}`, (err, data) => {
            if (err) reject(err);
            resolve(getTotals(data));
        })
    });
};