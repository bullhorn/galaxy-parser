// Vendor
import fs from 'fs';
import { parseString } from 'xml2js';

function getCounter(source, type) {
    return source.counter.filter(counter => {
        return counter.$.type === type;
    })[0];
}

let format = (report) => {
    var packages = report.package;
    var output = [];
    packages.forEach((pack) => {
        var cov = pack.sourcefile.map(s => {
            var fullPath = pack.$.name + '/' + s.$.name;
            var className = fullPath.substring(0, fullPath.lastIndexOf('.'));

            var c = pack.class.filter(cl => {
                return cl.$.name === className;
            })[0];

            var functions = getCounter(s, 'METHOD') || { $: { missed: 0, covered: 0 } };
            var lines = getCounter(s, 'LINE') || { $: { missed: 0, covered: 0 } };
            var branches = getCounter(s, 'BRANCH') || { $: { missed: 0, covered: 0 } };

            return {
                title: s.$.name,
                file: fullPath,
                functions: {
                    found: Number(functions.$.covered) + Number(functions.$.missed),
                    hit: Number(functions.$.covered),
                    details: c && c.method ? c.method.map(m => {
                        var hit = m.counter.some(counter => {
                            return counter.$.type === 'METHOD' && counter.$.covered === '1';
                        });
                        return {
                            name: m.$.name,
                            line: Number(m.$.line),
                            hit: hit ? 1 : 0
                        };
                    }) : []
                },
                lines: {
                    found: Number(lines.$.covered) + Number(lines.$.missed),
                    hit: Number(lines.$.covered),
                    details: !s.line ? [] : s.line.map(l => {
                        return {
                            line: Number(l.$.nr),
                            hit: Number(l.$.ci)
                        };
                    })
                },
                branches: {
                    found: Number(branches.$.covered) + Number(branches.$.missed),
                    hit: Number(branches.$.covered),
                    details: !s.line ? [] : [].concat.apply([],
                        s.line.filter(l => {
                            return Number(l.$.mb) > 0 || Number(l.$.cb) > 0;
                        })
                            .map(l => {
                                var branches = [];
                                var count = Number(l.$.mb) + Number(l.$.cb);

                                for (var i = 0; i < count; ++i) {
                                    branches = branches.concat({
                                        line: Number(l.$.nr),
                                        block: 0,
                                        branch: Number(i),
                                        taken: i < Number(l.$.cb) ? 1 : 0
                                    });
                                }

                                return branches;
                            })
                    )
                }
            };
        });
        output = output.concat(cov);
    });
    return output;
};

let parseContent = (xml, cb) => {
    parseString(xml, (err, result) => {
        if (err) {
            return cb(err);
        }
        cb(err, format(result.report));
    });
};

export default (file, cb) => {
    fs.readFile(file, 'utf8', (err, content) => {
        if (err) {
            return cb(err);
        }
        parseContent(content, cb);
    });
}
