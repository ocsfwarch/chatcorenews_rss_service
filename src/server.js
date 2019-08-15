let Parser           = require('rss-parser');
let hash             = require('hash-code');
let parser           = new Parser({defaultRSS:2.0});
const OcsaUtils      = require('./components/OcsaUtils');
const ocsaLogger     = new OcsaUtils();
const OcsaDbServices = require('./components/OcsaDbServices');
const ocsaDb         = new OcsaDbServices();
//const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"

class OcsaRssReader{

  constructor(){
    this.bDbConnValid   = false;
    this.feedList       = [];
    this.bFeedListValid = false;
    this.nTotalFeeds    = 0;
    this.nTotalErrors   = 0;
    this.nTotalSuccess   = 0;
  }

  runRssService(){
    ocsaLogger.writeToLog("START = runRssService");
    this.bDbConnValid = ocsaDb.openDbConnection();
    if(this.bDbConnValid){
      ocsaLogger.writeToLog("Success Opening Db Conn");
      const strSqlQuery = 'SELECT nFeedId, strFeedName AS name,strFeedValue AS value,strFeedCategory AS category, nAllowLookup FROM feedlist_table WHERE nActive = 1 ';
      ocsaDb.readFromDb(strSqlQuery)
        .then(result => {
          ocsaDb.closeDbConnection();
          ocsaLogger.writeToLog(`Results = ${result}`);
          let objJson = JSON.parse(ocsaDb.getJsonObj());
          objJson.forEach((feedItem) => {
              let arrayFeed     = feedItem.value.split(" ");
              const strFeedName = arrayFeed[1];
              const strFeedUrl  = arrayFeed[0];
              const nFeedId     = feedItem.nFeedId;
              //const nTitleHash  = 0;
              ocsaLogger.writeToLog(`nFeedId = ${nFeedId}`);
              (async() => {
                 //let feed = await parser.parseURL('https://www.reddit.com/.rss');
                 let feed = await parser.parseURL(strFeedUrl);
                 ocsaLogger.writeToLog(feed.title);
                 let feedItems = [];
                 feed.items.forEach(entry => {
                      const feedItem = {
                       nFeedId:nFeedId,
                       nTitleHash:hash.hashCode(entry.title.replace(/\s/g,'').toLowerCase()),
                       strTitle:entry.title,
                       strOrgTitle:entry.title,
                       strOrgUri:entry.link,
                       strLinkUri:entry.link,
                       strImageUri:'',
                       dtDateTime:'2019-08-14 03:04:52',
                       strDateTime:'August-14-2019, 3pm',
                       strDescription:entry.contentSnippet,
                       strCategory:'NEWS',
                       strFeedLink:feed.link,
                     }
                     //const strTitle   = entry.title;
                     //const nTitleHash = hash.hashCode(entry.title.replace(/\s/g,'').toLowerCase());
                     //ocsaLogger.writeToLog(`nFeedId = ${feedItem.nFeedId}`);
                     //ocsaLogger.writeToLog(`nTitleHash = ${feedItem.nTitleHash}`);
                     //ocsaLogger.writeToLog(`strTitle = ${feedItem.strTitle}`);
                     ocsaLogger.writeToLog(`strFeedLink = ${feedItem.strFeedLink}`);
                     feedItems.push(feedItem);
                 });
                 ocsaLogger.writeToLog(`FeedItems = ${feedItems.length}`);
                 return feedItems;
              })();
          });
        })        
        .catch(err => {ocsaLogger.writeToLog(`ERROR: ${err}`);ocsaDb.closeDbConnection();});
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