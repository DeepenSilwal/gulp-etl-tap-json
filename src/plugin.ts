const through2 = require('through2')
import Vinyl = require('vinyl')
import PluginError = require('plugin-error');
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
import * as loglevel from 'loglevel'
const log = loglevel.getLogger(PLUGIN_NAME) // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as log.LogLevelDesc)

var transform = require('qewd-transform-json').transform
var merge = require('merge'), original, cloned

/** wrap incoming recordObject in a Singer RECORD Message object*/
function createRecord(recordObject:Object, streamName: string) : any {
  return {type:"RECORD", stream:streamName, record:recordObject}
}

/* This is a gulp-etl plugin. It is compliant with best practices for Gulp plugins (see
https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md#what-does-a-good-plugin-look-like ),
and like all gulp-etl plugins it accepts a configObj as its first parameter */
export function tapJson(configObj: any, changeMap: any) {
  const strm = through2.obj(function (this: any, file: Vinyl, encoding: string, cb: Function) {
    const self = this
    let returnErr: any = null
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
      let inputObj = JSON.parse(file.contents.toString())

      //if the inputObj is array of object, we wrap it around { } so that input object is one single object 
      if (inputObj instanceof Array) {
        inputObj = {
          __rootArray: inputObj
        }
      }
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
     
      let resultArray = []
      if(newObj instanceof Array){//this is the case if you have array of maps
        for (let i in newObj){
         
          //root Array is only used when input object is an instance of array
          if (newObj[i].__rootArray) {//remove the wrapped rootArray 
            var tempObj = newObj[i].__rootArray
            if(tempObj instanceof Array){
              for (let j in tempObj){
                if (changeMap == true){
                  if(inputObj.__rootArray){
                    inputObj = inputObj.__rootArray
                  }  
                  tempObj[j] = merge(inputObj[j], tempObj[j])//merged mapped object with one input object but array of maps 
                }
                let handledObj = handleLine(tempObj[j], streamName)
                let tempLine = JSON.stringify(handledObj)
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
            if (changeMap == true){//case for one input object but array of maps
              newObj[i] = merge(inputObj, newObj[i])//once merged changes the input object to new merged object
            }
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
        if (newObj.__rootArray) {//case for array of input object but one map
          newObj = newObj.__rootArray
        }
        if (newObj instanceof Array) {
          for (let i in newObj) {
            if (changeMap == true){
              if(inputObj.__rootArray){
                inputObj = inputObj.__rootArray
              } 
              newObj[i] = merge(inputObj[i], newObj[i])//merged mapped object with input object for one objects but array of maps
            }
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
        else {//this is  the case of one object and one map
          if (changeMap == true){
            newObj = merge(inputObj, newObj)
          }
          let handledObj = handleLine(newObj, streamName)
          let tempLine = JSON.stringify(handledObj)
          resultArray.push(tempLine);
        }

      } 
      let data:string = resultArray.join('')
      file.contents = Buffer.from(data)
      cb(returnErr, file); 
    }
  })
  return strm
}