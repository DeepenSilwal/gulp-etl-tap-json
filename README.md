---
typora-copy-images-to: images
---

# gulp-etl-tap-json #

This plugin takes in two JSON format/file, one is a source JSON and another is template/map JSON. The template/map JSON describes the rules of how you want your JSON to be formatted. The plugin takes a source JSON and then converts to a different JSON using "**qewd-transfrom-json**". For more info check this link "https://www.npmjs.com/package/qewd-transform-json". The final output file is then converted to a message stream(**ndjson**). 

This is a **[gulp-etl](https://gulpetl.com/)** plugin, and as such it is a [gulp](https://gulpjs.com/) plugin. **gulp-etl** plugins work with [ndjson](http://ndjson.org/) data streams/files which we call **Message Streams** and which are compliant with the [Singer specification](https://github.com/singer-io/getting-started/blob/master/docs/SPEC.md#output). In the **gulp-etl** ecosystem, **taps** tap into an outside format or system (in this case, a JSON file) and convert their contents/output to a Message Stream, and **targets** convert/output Message Streams to an outside format or system. In this way, these modules can be stacked to convert from one format or system to another, either directly or with transformations or other parsing in between. Message Streams look like this:

```
{"type": "SCHEMA", "stream": "users", "key_properties": ["id"], "schema": {"required": ["id"], "type": "object", "properties": {"id": {"type": "integer"}}}}
{"type": "RECORD", "stream": "users", "record": {"id": 1, "name": "Chris"}}
{"type": "RECORD", "stream": "users", "record": {"id": 2, "name": "Mike"}}
{"type": "SCHEMA", "stream": "locations", "key_properties": ["id"], "schema": {"required": ["id"], "type": "object", "properties": {"id": {"type": "integer"}}}}
{"type": "RECORD", "stream": "locations", "record": {"id": 1, "name": "Philadelphia"}}
{"type": "STATE", "value": {"users": 2, "locations": 1}}
```

### Usage
**gulp-etl** plugins accept a configObj as the first parameter; the configObj will contain any info the plugin needs. For this plugin the configObj is the template/map. The plugin also contains another config other than template/map. The other config it takes in is called **merge**. What merge does is it merges source object and result object. The content of result object that we get after mapping is always different than input object. In order to create an result object similar to input object but just with the differences the **merge** config is used. For more info regarding **merge** click the link " <https://www.npmjs.com/package/merge>". The concept of **merge** is explained in diagram below:
![](<https://github.com/DeepenSilwal/gulp-etl-tap-json/blob/master/images/Untitled%20Diagram%20(1).jpg>)		

The JSON format files can be of different content, they may be just an object, instance of array containing object, or array of objects.
The **gulp-etl-tap-json** specifically looks into four different cases the user might run into. These cases are described below:

1. The source JSON contains only one object and the template/map JSON also contains one object.
   ![](C:\Users\ernes\Desktop\Untitled Diagram.jpg)

2. The source JSON contains only one object but the template/map JSON contains array of object.
   ![](C:\Users\ernes\Desktop\Untitled Diagram (6).jpg)

3. The source JSON is an array of object and template/map JSON is also an array of object. The "**qewd-transform-stream**" takes only objects. Therefore, when the input object is in the form of array of objects it is wrapped around **rootarray object**. For eg: **rootarray{ [ { },{ },... ] }** 
   ![](C:\Users\ernes\Desktop\Untitled Diagram (7).jpg)

   

4. The source JSON is an array of object but template/map JSON contains one object. The "**qewd-transform-stream**" takes only objects. Therefore, when the input object is in the form of array of objects it is wrapped around **rootarray object**. For eg: **rootarray{ [ { },{ },... ] }** 
   ![](C:\Users\ernes\Desktop\Untitled Diagram (8).jpg)



##### Sample gulpfile.js

```
/* maps all .JSON files in a folder into Message Stream files in a different folder *

let gulp = require('gulp')
var rename = require('gulp-rename')
var tapJson = require('gulp-etl-tap-json').tapJson
var maps = require('../testdata/maps/map-oneobject.json');

var mergeOriginal = false;//if you want your final object as an original object but with only the differences change to 'true'

function runTapJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)

  return gulp.src('../testdata/tests/test-oneobject.json',{buffer: true})
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
```
### Quick Start for Coding on This Plugin
* Dependencies: 
    * [git](https://git-scm.com/downloads)
    * [nodejs](https://nodejs.org/en/download/releases/) - At least v6.3 (6.9 for Windows) required for TypeScript debugging
    * npm (installs with Node)
    * typescript - installed as a development dependency
* Clone this repo and run `npm install` to install npm packages
* Debug: with [VScode](https://code.visualstudio.com/download) use `Open Folder` to open the project folder, then hit F5 to debug. This runs without compiling to javascript using [ts-node](https://www.npmjs.com/package/ts-node)
* Test: `npm test` or `npm t`
* Compile to javascript: `npm run build`

### Testing

We are using [Jest](https://facebook.github.io/jest/docs/en/getting-started.html) for our testing. Each of our tests are in the `test` folder.

- Run `npm test` to run the test suites



Note: This document is written in [Markdown](https://daringfireball.net/projects/markdown/). We like to use [Typora](https://typora.io/) and [Markdown Preview Plus](https://chrome.google.com/webstore/detail/markdown-preview-plus/febilkbfcbhebfnokafefeacimjdckgl?hl=en-US) for our Markdown work..
