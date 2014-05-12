#!/usr/bin/env node
var esprima = require('esprima');
var escodegen = require('escodegen');
var util = require('util');
var fs = require('fs');
var optimist = require('optimist');
var argv = optimist
    .usage("Usage: $0 -n modulename -e export [file]")
    .options('n', {
        "alias": "name",
        "describe": "module name to define",
        "demand": true
    })
    .options('e', {
        "alias": "export",
        "describe": "The symbol to export as this module",
        "demand": true
    })
    .options('r', {
        "alias": "require",
        "describe": "Add dependency"
    })
    .options('w', {
        "alias": "wrap",
        "describe": "Wrap in a function instead of appending the shim",
        "default": false
    })
    .options('h', {
        "alias": "help",
        "describe": "Show help"
    }).argv;

if (argv.h || argv._.length > 1) {
    optimist.showHelp();
    process.exit();
}

if (!argv.require) {
    argv.require = [];
} else if (!Array.isArray(argv.require)) {
    argv.require = [argv.require];
}

if (argv._.length) {
    fs.readFile(argv._[0], 'utf-8', function(err, src) {
        if (err) throw(err);
        parse(src);
    });
} else {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    var str = '';
    process.stdin.on('data', function (chunk) { str += chunk; });

    process.stdin.on('end', function () {
        parse(str);
    });
}

function parse(src) {
    var tree = esprima.parse(src);

    tree.body = addDefine(tree);

    console.log(escodegen.generate(tree));
}

function addDefine(node) {
    if (argv.wrap) {
        return [{
            type: 'ExpressionStatement', expression: {
                type: 'CallExpression', callee: {
                    type: "Identifier", name: "define"
                }, "arguments": [
                    { type: "Literal", value: argv.name },
                    { type: "ArrayExpression", elements: argv.require.map(function(e) { return { type: "Literal", value: e }; }) }, 
                    { type: 'FunctionExpression', params: [], defaults: [], expression: false, generator: false, rest: null, body: {
                        type: 'BlockStatement', body: node.body.concat([{
                            type: 'ReturnStatement', argument: {
                                type: "Identifier", name: argv['export']
                            }
                        }])
                    }}
                ]
            }
        }];
    } else {
        return node.body.concat([{
            type: 'ExpressionStatement', expression: {
                type: 'CallExpression', callee: {
                    type: "Identifier", name: "define"
                }, "arguments": [
                    { type: "Literal", value: argv.name },
                    { type: "ArrayExpression", elements: argv.require.map(function(e) { return { type: "Literal", value: e }; }) }, 
                    { type: 'FunctionExpression', params: [], defaults: [], expression: false, generator: false, rest: null, body: {
                        type: "BlockStatement", body: [{
                            type: 'ReturnStatement', argument: {
                                type: "Identifier", name: argv['export']
                            }
                        }]
                    }
                }]
            }
        }]);
    }
}
