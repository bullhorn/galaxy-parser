export default function (data) {
    let totals = {
        lines: { hit: 0, found: 0 },
        functions: { hit: 0, found: 0 },
        branches: { hit: 0, found: 0 }
    }
    data.forEach(d => {
        totals.lines.found += d.lines.found;
        totals.lines.hit += d.lines.hit;
        totals.functions.found += d.functions.found;
        totals.functions.hit += d.functions.hit;
        totals.branches.found += d.branches.found;
        totals.branches.hit += d.branches.hit;
    });
    totals.lines.percent = Number(((totals.lines.hit / totals.lines.found) * 100).toFixed(2));
    totals.functions.percent = Number(((totals.functions.hit / totals.functions.found) * 100).toFixed(2));
    totals.branches.percent = Number(((totals.branches.hit / totals.branches.found) * 100).toFixed(2));
    return { dashboard: totals, report: data };
}