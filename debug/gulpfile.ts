
let gulp = require('gulp')
import { tapJson } from '../src/plugin'

import * as loglevel from 'loglevel'
const log = loglevel.getLogger('gulpfile')
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as log.LogLevelDesc)
// if needed, you can control the plugin's logging level separately from 'gulpfile' logging above
// const pluginLog = loglevel.getLogger(PLUGIN_NAME)
// pluginLog.setLevel('debug')

import * as rename from 'gulp-rename'
const errorHandler = require('gulp-error-handle'); // handle all errors in one handler, but still stop the stream if there are errors

const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;

import Vinyl = require('vinyl') 

var maps = require('../testdata/maps/map-oneobject.json');

var mergeOriginal = false;//if you want your final object as an original object but with only the differences
function switchmergeOriginal(callback: any) {
  mergeOriginal = true;

  callback();
}

let gulpBufferMode = false;

/*
function switchToBuffer(callback: any) {
  gulpBufferMode = true;

  callback();
}*/

function runTapJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)

  return gulp.src('../testdata/tests/test-arrayofobject - Copy.json',{buffer: true})
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename)
    })    
    .pipe(tapJson(maps, mergeOriginal))
    .pipe(rename({
      extname: ".ndjson",
    }))      
    .pipe(gulp.dest('../testdata/processed'))
    .on('data', function (file:Vinyl) {
      log.info('Finished processing on ' + file.basename)
    })    
    .on('end', function () {
      log.info('gulp task complete')
      callback()
    })

}
/*
export function csvParseWithoutGulp(callback: any) {

  const parse = require('csv-parse')

  var parser = parse({delimiter: ',', columns:true});
  
  require('fs').createReadStream('../testdata/cars.csv').pipe(parser)
  .on("data",(data:any)=>{
    console.log(data)
  });
  
}*/

function oneInputMap(callback: any) {
  maps = require('../testdata/maps/map-oneobject - Copy.json');
  callback();
}

function oneInputarrayMap(callback: any) {
  maps = require('../testdata/maps/map-arrayofobject - Copy.json');
  callback();
}

function arrayInputarrayMap(callback: any) {
  maps = require('../testdata/maps/map-arrayofobject-rootarray - Copy.json');
  callback();
}

function arrayInputoneMap(callback: any) {
  maps = require('../testdata/maps/map-oneobject-rootarray - Copy.json');
  callback();
}

//make sure you have correct type of input object file
exports.default = gulp.series(runTapJson)

//input file with one object is required
exports.oneinputobjectonemapobject = gulp.series(oneInputMap, runTapJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.oneinputobjectonemapobjectmerge = gulp.series(switchmergeOriginal, oneInputMap, runTapJson)

//input file with one object is required
exports.oneinputobjectarraymapobject = gulp.series(oneInputarrayMap, runTapJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.oneinputobjectarraymapobjectmerge = gulp.series(switchmergeOriginal, oneInputarrayMap, runTapJson)

//input file with array of object is required
exports.arrayinputobjectarraymapobject = gulp.series(arrayInputarrayMap, runTapJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.arrayinputobjectarraymapobjectmerge = gulp.series(switchmergeOriginal, arrayInputarrayMap, runTapJson)

//input file with array of object is required
exports.arrayinputobjectonemapobject = gulp.series(arrayInputoneMap, runTapJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.arrayinputobjectonemapobjectmerge = gulp.series(switchmergeOriginal, arrayInputoneMap, runTapJson)






//exports.runTapCsvBuffer = gulp.series(switchToBuffer, runTapCsv)




