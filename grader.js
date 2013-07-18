#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var URLFILE_DEFAULT = "";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    console.log("assertFileExists: "+instr); //debug
    if (instr.substring(0, 4)==="http") {
      rest.get(infile).on('error', function(result) {
        console.log("Could not connect to %s. Exiting.", instr);
        process.exit(1);
      });
    } else if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    console.log("cheerioHtmlFile: "+htmlfile); //debug
    if (htmlfile.substring(0, 4)==="http") {
      console.log("cheerioHtmlFile ishtml"); //debug
      rest.get(htmlfile).on('complete', function(result, response) {
        console.log("cheerioHtmlFile rest"); //debug
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
          console.log("cheerioHtmlFile rest result "+result+" response"+response); //debug

          return cheerio.load(result);
        }
      });
    } else {
      return cheerio.load(fs.readFileSync(htmlfile));
    }
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    console.log("checkHtmlFile: "+htmlfile); //debug
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
  if(process.argv[process.argv.length-2] == '--url'){
        rest.get(process.argv[process.argv.length-1]).on('complete', function(result){
            if(result instanceof Error){
                console.error('Error: ' + result);
            } else {
                fs.writeFileSync('index.html', result);
                process.argv[process.argv.length-1] = 'index.html';
                program
                    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
                    .option('-u, --url <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
                    .parse(process.argv);
                var checkJson = checkHtmlFile('index.html', program.checks);
                var outJson = JSON.stringify(checkJson, null, 4);
                console.log(outJson);
                fs.writeFileSync('hw3p3.json', outJson);
            }
        });
  } else if(process.argv[process.argv.length-2] == '--file'){
        program
            .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
            .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
            .parse(process.argv);
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
        fs.writeFileSync('hw3p3.json', outJson);
  }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}