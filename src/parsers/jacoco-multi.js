// APP
import parse from './utils/jacoco-parse';
import each from 'async/each';
import getTotals from './utils/get-totals';

export default function(fileLocations) {
  return new Promise((resolve, reject) => {
    let results = [];
    let byModule = {};
    each(
      fileLocations,
      (fileLocation, callback) => {
        parse(`${process.cwd()}/${fileLocation}`, (err, data) => {
          if (err) reject(err);
          results = results.concat(data);
          byModule[fileLocation.split('/')[2]] = getTotals(data);
          callback();
        });
      },
      () => {
        let result = getTotals(results);
        resolve({
          totals: result.totals,
          files: result.files,
          byModule: byModule,
        });
      },
    );
  });
}
