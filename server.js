let Parser = require('rss-parser');
const mysql = require('mysql');
let hash = require('hash-code');
let parser = new Parser({defaultRSS:2.0});
//const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"

class OcsaRssReader{

  constructor(){
    this.dbConn = null;
    this.bDbConnValid = false;
    this.feedList = [];
    this.bFeedListValid = false;
    this.nTotalFeeds = 0;
    this.nTotalErrors = 0;
    this.nTotalSuccess = 0;
    //this.ocsaLogger = new OcsaUtils();
  }

  writeToLog(strLogMsg){
    //let fs = require('fs');
    //fs.writeFile(this.m_strLogFile, strLogMsg, (err) => {
    //    if(err){
    //        console.log(`ERROR Writing File = ${err}`);
    //    }else{
    //        console.log(`SUCCESS WRITING FILE.`);
    //    }
    //});
    console.log(strLogMsg);
  }


  openDbConnection(){
    if(this.dbConn === null){
      this.dbConn = mysql.createConnection({
          host: 'localhost',
          user: 'ocsfwarch',
          password: 'TP2013bb',
          database:'chat_news'
      });   
      // Connect to database
      this.dbConn.connect();
      this.bDbConnValid = true; 
    }
  }

  closeDbConnection(){
    if(this.dbConn !== null){
      this.dbConn.end();
      console.log("Success Closing Db Conn");
    }
  }

  async asyncForEach(array, callback){
    for( let index = 0; index < array.length; index++){
      await callback(array[index], index, array);
    }
  }

  readFeedList(){
    return new Promise((resolve,reject) => {
      //this.dbConn.query('SELECT nFeedId, strFeedName AS name,strFeedValue AS value,strFeedCategory AS category, nAllowLookup FROM feedlist_table WHERE nActive = 1 ORDER BY category, name',
      this.dbConn.query('SELECT nFeedId, strFeedName AS name,strFeedValue AS value,strFeedCategory AS category, nAllowLookup FROM feedlist_table WHERE nActive = 1 ',
      (error, results, fields) => {
          if(error){
            this.bFeedListValid = false;
            return reject("readFeedList failed to execute")
          }
          //console.log("Total = " + results.length);
          //console.log(JSON.stringify(results));
          this.feedList = JSON.stringify(results);
          this.bFeedListValid = true;
          return resolve(`readFeedList executed successfully`);
      });
    });
  }

  processRssFeeds(){
    return new Promise((resolve,reject) => {
      let objJson = JSON.parse(this.feedList);
      this.nTotalFeeds = objJson.length;
      this.nTotalErrors = 0;
      this.nTotalSuccess = 0;  
      let nSuccesses = 0;
      let nErrors = 0;    
      objJson.forEach((item) => {
        let arrayFeed = item.value.split(" ");
        const strFeedName = arrayFeed[1];
        const strFeedUrl = arrayFeed[0];
        console.log(`Processing ${strFeedName}`);
        parser.parseURL(strFeedUrl, function(err, feed){
          if(err){
            //nErrors++;
            console.log(`Got an error = ${err}, for ${strFeedName}`);
          }else{
            //nSuccesses++;
            console.log(`Feed size = ${feed.items.length} for ${strFeedUrl}`);
          }
        });
      });
      if(nSuccesses === 0){
        return reject("Error during processRssFeeds");
      }else{
        return resolve("processRssFeeds worked!");
      }
    });
  }

  hashString(str){
    let hash = 0;
    for( let i = 0; i < str.length; i++){
      hash += Math.pow(str.charCodeAt(i)*31, str.length-1);
      hash = hash & hash;
    }
    return hash;
  }
  
  runParseUrl(strFeedUrl){
    return new Promise((resolve,reject) => {
      parser.parseURL(strFeedUrl, function(err, feed){
        if(err){
         return reject(`Got an error, parseURL = ${err}`);
        }else{
          const nSize = feed.items.length;
          //let nCount = 0;
          //if(nSize > 0 && nCount === 0){
          //  nCount++;
          //  feed.items.forEach((entry) => {
          //    let strTest = entry.title;
          //    const re = new RegExp('\\w+');
          //    let strTitle = entry.title.replace(/\s/g,'').toLowerCase();
          //    //const nTitleHash = this.hashString(strTitle);
          //    let strLink  = entry.link;
          //    let strUpdateDate = entry.pubDate;
          //    let strDescription = entry.content;
          //    let strDescSnippet = entry.contentSnippet;
          //  });
          //}
          //return resolve(`nSize = ${nSize}, Feed Ok = ${strFeedUrl}`);
          resolve(strFeedUrl);
        }
      });
  
    });
  }

  processFeedItem(feedItem){
    return new Promise((resolve, reject) =>{
      let arrayFeed = feedItem.value.split(" ");
      const strFeedName = arrayFeed[1];
      const strFeedUrl = arrayFeed[0];
      console.log(`Processing ${strFeedName}`);
      this.runParseUrl(strFeedUrl)
      .then((results) => {
        //console.log(`runParseUrl = ${results}`);
        return resolve(results);})
      .catch((err) => {
        return reject(err);});
    });
  }

  runRssService(){
    this.openDbConnection();
    if(this.bDbConnValid){
      console.log("Success Opening Db Conn");
      //this.writeToLog("HELLO FROM LOGGER");
      this.readFeedList()
        .then(result => {
          this.closeDbConnection();
          console.log(`Results = ${result}`);
          let promises = [];
          let objJson = JSON.parse(this.feedList);
          objJson.forEach((feedItem) => {
            let arrayFeed     = feedItem.value.split(" ");
            const strFeedName = arrayFeed[1];
            const strFeedUrl  = arrayFeed[0];
            const nFeedId     = feedItem.nFeedId;
            //const nTitleHash  = 0;
           console.log(`nFeedId = ${nFeedId}`);
            //console.log(`${strFeedName}, ${strFeedUrl}`);
            (async() => {
              //let feed = await parser.parseURL('https://www.reddit.com/.rss');
              let feed = await parser.parseURL(strFeedUrl);
              console.log(feed.title);
              feed.items.forEach(entry => {
                //console.log(item.title + ':' + item.link);
                const strTitle = entry.title;
                const nTitleHash = hash.hashCode(entry.title.replace(/\s/g,'').toLowerCase());
                console.log(`nFeedId = ${nFeedId}`);
                console.log(`nTitleHash = ${nTitleHash}`);
                console.log(`strTitle = ${strTitle}`);
              });
            })();
          });

          //Promise.all(promises)
          //.then((result) => {
          //  //result.forEach((item) => console.log(item));
          //  console.log(`All Resolved = ${result}`);
          //})
          //.catch((err) => {
          //  //err.forEach((item) => console.log(item));
          //  console.log(`Errors = ${err}`);
          //});
        })        
        .catch(err => {console.log(`ERROR: ${err}`);this.closeDbConnection();});
    }
    return false;
  }
}

let theReader = new OcsaRssReader();
//theReader.writeToLog('test');
theReader.runRssService();
console.log("DONE");




//function testRSS(){
//    parser.parseURL('http://www.realtruenews.org/feed.xml', function(err, feed) {
//        console.log(`Feed Size = ${feed.items.length}`);
//        feed.items.forEach(function(entry) {
//          console.log(entry.title + ':' + entry.link);
//          console.log('*******************************');
//        });
//      });
//}// End of testRSS

//console.log("Ready to start testRSS");
//testRSS();
//if(readFeedList()){
//  console.log("Got the FeedList");
//  console.log(feedList[data].length);
//}else{
//  console.log("Error getting FeedList");
//}

//dbConn.end();