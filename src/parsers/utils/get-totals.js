// Vendor
import path from 'path';

export default function (data) {
    let totals = {
        lines: {
            hit: 0,
            found: 0
        },
        functions: {
            hit: 0,
            found: 0
        },
        branches: {
            hit: 0,
            found: 0
        }
    };
    let files = [];
    data.forEach(d => {
        totals.lines.found += d.lines.found;
        totals.lines.hit += d.lines.hit;
        totals.functions.found += d.functions.found;
        totals.functions.hit += d.functions.hit;
        totals.branches.found += d.branches.found;
        totals.branches.hit += d.branches.hit;
        // Keep track of files
        if (d.file) {
            files.push({
                file: path.basename(d.file),
                lines: Number(((d.lines.hit / d.lines.found) * 100).toFixed(2)),
                functions: Number(((d.functions.hit / d.functions.found) * 100).toFixed(2)),
                branches: Number(((d.branches.hit / d.branches.found) * 100).toFixed(2)),
            });
        }
    });
    totals.lines.percent = Number(((totals.lines.hit / totals.lines.found) * 100).toFixed(2));
    totals.functions.percent = Number(((totals.functions.hit / totals.functions.found) * 100).toFixed(2));
    totals.branches.percent = Number(((totals.branches.hit / totals.branches.found) * 100).toFixed(2));
    return {
        totals,
        files
    };
}