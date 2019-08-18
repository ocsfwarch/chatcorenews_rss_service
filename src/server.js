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
    this.feedList       = null;
    this.bFeedListValid = false;
    this.nTotalFeeds    = 0;
    this.nTotalErrors   = 0;
    this.nTotalSuccess   = 0;
  }

  async parseFeedItems(nFeedId, theFeed){
    let bReturn = false;
    const nLen = theFeed.items.length;
    let nCounter = 0;
    try{
      ocsaLogger.writeToLog(`Total Items = ${theFeed.items.length}`);
      let nIndex = 0;
      let bResults = false;
      for(nIndex; nIndex < nLen; nIndex++){
        const entry = theFeed.items[nIndex];        
        const feedItem = {
          nFeedId:nFeedId,
          nTitleHash:hash.hashCode(entry.title.replace(/\s/g,'').toLowerCase()),
          strTitle:entry.title.replace(/'/g,"''"),
          strOrgUri:entry.link.replace(/'/g,"''"),
          strLinkUri:entry.link,
          strImageUri:'',
          strDateTime:'August-14-2019, 3pm',
          strDescription:entry.contentSnippet.replace(/'/g,"''"),
          strCategory:'NEWS',
          strFeedLink:theFeed.link
        }
        const strDupQueryCheck = `SELECT nFeedId FROM feedresults_table WHERE nFeedId = ${feedItem.nFeedId} AND nTitleHash = ${feedItem.nTitleHash}`;
        bResults = await ocsaDb.readValueFromDb('nFeedId', strDupQueryCheck);
        if(!bResults){
          const strQuery = `INSERT INTO feedresults_table(nFeedId, nTitleHash, strTitle, strOrgUri, strLinkUri, strImageUri, strDateTime, strDescription,strCategory,strFeedLink)VALUES(${feedItem.nFeedId},${feedItem.nTitleHash},\'${feedItem.strTitle}\',\'${feedItem.strOrgUri}\',\'${feedItem.strLinkUri}\',\'${feedItem.strImageUri}\',\'${feedItem.strDateTime}\',\'${feedItem.strDescription}\',\'${feedItem.strCategory}\',\'${feedItem.strFeedLink}\')`;
          bResults = await ocsaDb.writeToDb(strQuery);
          if(bResults){
            nCounter++;
            bResults = false;
          }
        }// End if(!bResults)
      }// End for()
    }catch(err){
        ocsaLogger.writeToLog(`parseFeedItem Error: ${err}`);
        return err;
    }
    ocsaLogger.writeToLog(`Total = ${nLen}, Counted = ${nCounter}`);
    return bReturn;
  }// End parseFeedItem()

  async parseFeedList(){
    let bReturn = false;
    try{
      ocsaLogger.writeToLog(`Opening Database...`);
      this.bDbConnValid = ocsaDb.openDbConnection();
      if(this.bDbConnValid){
        const nLen = this.feedList.length;
        let nIndex = 0;
        for(nIndex; nIndex < nLen; nIndex++){
          const nFeedId    = this.feedList[nIndex].nFeedId;
          const strFeedUrl = this.feedList[nIndex].value;
          ocsaLogger.writeToLog(`nFeedId = ${nFeedId}, Url = ${strFeedUrl}`);
          let feed = await parser.parseURL(strFeedUrl);
          await this.parseFeedItems(nFeedId, feed);
        }// End for()
        ocsaLogger.writeToLog(`Closing Database...`);
        this.bDbConnValid = ocsaDb.closeDbConnection();
      }// End if(this.bDbConnValid)
    }catch(err){
      ocsaLogger.writeToLog(`parseFeedList Error: ${err}`);
      ocsaLogger.writeToLog(`Closing Database...`);
      this.bDbConnValid = ocsaDb.closeDbConnection();
    }
    return bReturn;
  }// End parseFeedList()

  async getFeedList(){
    let bReturn = false;
    try{
      ocsaLogger.writeToLog(`Opening Database...`);
      this.bDbConnValid = ocsaDb.openDbConnection();
      if(this.bDbConnValid){
        ocsaLogger.writeToLog("Success Opening Db Conn");
        const strSqlQuery = 'SELECT nFeedId, strFeedTitle as title, strFeedName AS name,strFeedUrl AS value,strFeedCategory AS category, nAllowLookup FROM feedlist_table WHERE nActive = 1 ';
        let dbResults = await ocsaDb.readFromDb(strSqlQuery);
        if(dbResults){
          this.feedList = JSON.parse(ocsaDb.getJsonObj());
          ocsaLogger.writeToLog(`Size = ${this.feedList.length}`);
          bReturn = true;
        }
        this.bDbConnValid = ocsaDb.closeDbConnection();
        ocsaLogger.writeToLog(`Closing Database...`);
      }else{
        ocsaLogger.writeToLog("ERROR - Failed open database");
      }
    }catch(err){
      ocsaLogger.writeToLog(err);
    }// End catch
    return bReturn;
  }// End getFeedList()

  async runFeedUpdate(){
    let bReturn = false;
    try{
      bReturn = await this.getFeedList();
      if(bReturn){
        ocsaLogger.writeToLog(`Starting parseFeedList`);
        bReturn = await this.parseFeedList();
      }
    }catch(err){
      ocsaLogger.writeToLog(err);
    }
    return bReturn;
  }

  runRssService(){
    this.runFeedUpdate().then(
      result => {ocsaLogger.writeToLog(`Final Results = ${result}`);}
    ).catch(err => {ocsaLogger.writeToLog(`${err}`);});
  }
}// End class OcsaRssReader

let theReader = new OcsaRssReader();
theReader.runRssService();
