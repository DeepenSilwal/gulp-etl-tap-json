const through2 = require('through2')
import Vinyl = require('vinyl')
import PluginError = require('plugin-error');
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
import * as loglevel from 'loglevel'
const log = loglevel.getLogger(PLUGIN_NAME) // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as log.LogLevelDesc)

var transform = require('qewd-transform-json').transform
//const parse = require('csv-parse')

/** wrap incoming recordObject in a Singer RECORD Message object*/
function createRecord(recordObject:Object, streamName: string) : any {
  return {type:"RECORD", stream:streamName, record:recordObject}
}

/* This is a gulp-etl plugin. It is compliant with best practices for Gulp plugins (see
https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md#what-does-a-good-plugin-look-like ),
and like all gulp-etl plugins it accepts a configObj as its first parameter */
export function tapJson(configObj: any) {
  //if (!configObj) configObj = {}
 // if (!configObj.columns) configObj.columns = true // we don't allow false for columns; it results in arrays instead of objects for each record

  // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
  // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
  const strm = through2.obj(function (this: any, file: Vinyl, encoding: string, cb: Function) {
    const self = this
    let returnErr: any = null
    //const parser = parse(configObj)

    // post-process line object
    const handleLine = (lineObj: any, _streamName : string): object | null => {
        let newObj = createRecord(lineObj, _streamName)
        lineObj = newObj
      return lineObj
    }

    // set the stream name to the file name (without extension)
    let streamName : string = file.stem

    if (file.isNull()) {
      // return empty file
      return cb(returnErr, file)
    }
    else if (file.isBuffer()) {
      
      //console.log(file.contents.toString())
      let inputObj = JSON.parse(file.contents.toString())
     // console.log(JSON.stringify(inputObj));
      
      //if the inputObj is array of object, we wrap it around { } so that input object is one single object 
      if (inputObj instanceof Array) {
        inputObj = {
          __rootArray: inputObj
        }
      }
      //console.log(JSON.stringify(inputObj))
      let counters: any = {}
      /** Increment the indicated value by adding incAmt. Returns null, so the object containing this call is unaffected
       */
      let incCounter = function(name: string, incAmt: any) {
        if (!counters[name]) counters[name] = 0
        counters[name] += 1 * incAmt
      }
      /** Gets an existing counter. If incAmt is passed in, increment first and then return the counter */
      let getCounter = function(name: string, incAmt?: any) {
        if (incAmt) incCounter(name, incAmt)
        return counters[name]
      }
    
      let asString = function(value: string): string {
        return '' + value
      }
      let asNumber = function(value: number): number {
        return 1 * value
      }
      let subStr = function(value: string, start: number, count: number) {
        return value.substr(start, count)
      }

      try{
        var newObj = transform(configObj, inputObj, {
          incCounter,
          getCounter,
          asString,
          asNumber,
          subStr
        });
      }
      catch(err){
        console.error(err);
      }
      console.log(JSON.stringify(newObj))
      let resultArray = []
      if(newObj instanceof Array){
        for (let i in newObj){
          //console.log(JSON.stringify(newObj[i]))
          if (newObj[i].__rootArray) {
            var tempObj = newObj[i].__rootArray
            if(tempObj instanceof Array){
              for (let j in tempObj){
                let handledObj = handleLine(tempObj[j], streamName)
               //console.log(JSON.stringify(newObj[i]))
                let tempLine = JSON.stringify(handledObj)
                //console.log(JSON.stringify(handledObj))
                if(j != "0" || i != "0"){
                  resultArray.push('\n');
                }
                if(tempLine){
                  resultArray.push(tempLine);  
                } 
              }
            }
            
          }
          else{
            let handledObj = handleLine(newObj[i], streamName)
            let tempLine = JSON.stringify(handledObj) 
            if(i != "0"){
              resultArray.push('\n');
            }
            if(tempLine){
              resultArray.push(tempLine);  
            } 
            
          }
        }
      }
      else{
        if (newObj.__rootArray) {
          newObj = newObj.__rootArray
        }
        
        //console.log(JSON.stringify(newObj))
        if (newObj instanceof Array) {
          for (let i in newObj) {
            let handledObj = handleLine(newObj[i], streamName)
            //console.log(JSON.stringify(newObj[i]))
            let tempLine = JSON.stringify(handledObj)
            //console.log(JSON.stringify(handledObj))
            if(i != "0"){
              resultArray.push('\n');
            }
            if(tempLine){
              resultArray.push(tempLine);  
            } 
          } 
        } 
        else {
          let handledObj = handleLine(newObj, streamName)
          let tempLine = JSON.stringify(handledObj)
          resultArray.push(tempLine);
        }

      }
      
      
      let data:string = resultArray.join('')
      file.contents = Buffer.from(data)
     
      cb(returnErr, file); 
      
      
      
      

      /*
      (file.contents as Buffer, configObj, function(err:any, linesArray : []){
        // this callback function runs when the parser finishes its work, returning an array parsed lines 
        let tempLine: any
        let resultArray = [];
        // we'll call handleLine on each line
        for (let dataIdx in linesArray) {
          try {
            let lineObj = linesArray[dataIdx]
            tempLine = handleLine(lineObj, streamName)
            if (tempLine){
              let tempStr = JSON.stringify(tempLine)
              log.debug(tempStr)
              resultArray.push(tempStr);
            }
          } catch (err) {
            returnErr = new PluginError(PLUGIN_NAME, err);
          }
        }
        let data:string = resultArray.join('\n')

        file.contents = Buffer.from(data)
        
        // we are done with file processing. Pass the processed file along
        log.debug('calling callback')    
        cb(returnErr, file);    
      })*/

    }
    /*
    else if (file.isStream()) {
      file.contents = file.contents
        .pipe(parser)
        .on('end', function () {

          // DON'T CALL THIS HERE. It MAY work, if the job is small enough. But it needs to be called after the stream is SET UP, not when the streaming is DONE.
          // Calling the callback here instead of below may result in data hanging in the stream--not sure of the technical term, but dest() creates no file, or the file is blank
          // cb(returnErr, file);
          // log.debug('calling callback')    

          log.debug('csv parser is done')
        })
        // .on('data', function (data:any, err: any) {
        //   log.debug(data)
        // })
        .on('error', function (err: any) {
          log.error(err)
          self.emit('error', new PluginError(PLUGIN_NAME, err));
        })
        .pipe(newTransformer(streamName))

      // after our stream is set up (not necesarily finished) we call the callback
      log.debug('calling callback')    
      cb(returnErr, file);
    }*/

  })

  return strm
}