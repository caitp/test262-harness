var test = require('tape');
var utils = require('./utils');
var expected = require('./expected');
var rimraf = require('rimraf');
var fs = require('fs');
var path = require('path');

var runners = [
    '-r node',
    '-r node-ip',
    '-r console -e node'
]

// clean testOutput dir
rimraf.sync('./testOutput');

// default arguments and strict mode
runners.forEach(function(runner) {
    utils.testResultsCorrect(runner, expected.noTestStrict);
    utils.testResultsCorrect(runner + ' --testStrict', expected);
    test("compiling failures: " + runner + " -C failures -o testOutput", function(t) {
        t.plan(2);
        utils.run(runner + " -C failures -o testOutput", function(res, stderr) {
            t.ok(fs.existsSync('./testOutput/error.js'), 'testOutput/error.js exists');
            t.ok(fs.existsSync('./testOutput/thrownError.js'), 'testOutput/thrownError.js exists');
            rimraf.sync('./testOutput');
        });
    });

    test("compiling failures: " + runner + " -C failures -o testOutput --testStrict", function(t) {
        t.plan(4);
        utils.run(runner + " -C failures -o testOutput --testStrict", function(res, stderr) {
            t.ok(fs.existsSync('./testOutput/error.js'), 'testOutput/error.js exists');
            t.ok(fs.existsSync('./testOutput/error-0.js'), 'testOutput/error-0.js exists');
            t.ok(fs.existsSync('./testOutput/thrownError.js'), 'testOutput/thrownError.js exists');
            t.ok(fs.existsSync('./testOutput/thrownError-0.js'), 'testOutput/thrownError-0.js exists');
            rimraf.sync('./testOutput');
        });
    });
});

// test exclusion
utils.testResultsCorrect('-c test/excludeConfig.js', expected.excludeAB);

// batch mode supported by console runner
utils.testResultsCorrect('-r console -e node -b 5 -c test/nodeConfig.js', expected.noTestStrict);
utils.testResultsCorrect('-r console -e node -b 5 --testStrict -c test/nodeConfig.js', expected);

// batch mode not supported by node and node-ip
['node', 'node-ip'].forEach(function(runner) {
    var args = '-r ' + runner + ' -b 5';
    test(args, function(t) {
        t.plan(2);

        utils.run(args, function(res, stderr) {
            t.equal(res.length, 0, 'no results');
            t.ok(stderr.length > 0, 'stderr is present');
        });
    })
});

test('compile flag defaults to compiling all collateral', function(t) {
    utils.run("-r node -C -o testOutput", function(res, stderr) {
        expected.noTestStrict.forEach(function(exp) {
            var expectedLoc = './testOutput/' + path.basename(exp.file);
            t.ok(fs.existsSync(expectedLoc), expectedLoc + ' exists');
        })

        rimraf.sync('./testOutput');
        t.end();
    });
});

test('compile flag defaults to compiling all collateral', function(t) {
    utils.run("-r node -C all -o testOutput", function(res, stderr) {
        expected.noTestStrict.forEach(function(exp) {
            var expectedLoc = './testOutput/' + path.basename(exp.file);
            t.ok(fs.existsSync(expectedLoc), expectedLoc + ' exists');
        })

        rimraf.sync('./testOutput');
        t.end();
    });
});

test('compile flag throws without output directory', function(t) {
    t.plan(2);

    utils.run('-r node -C failures', function(res, stderr) {
        t.equal(res.length, 0, 'no results');
        t.ok(stderr.length > 0, 'stderr is present');
        rimraf.sync('./testOutput');
    });
});
