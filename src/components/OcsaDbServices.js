const mysql        = require('mysql');

class OcsaDbServices{

    constructor(){
        this.dbConn         = null;
        this.jsonObj        = null;
    }

    openDbConnection(){
        if(this.dbConn === null){
        this.dbConn = mysql.createConnection({
            host:     'localhost',
            user:     'ocsfwarch',
            password: 'TP2013bb',
            database: 'chat_news'
        });   
        // Connect to database
        this.dbConn.connect();
        return true; 
        }
    }

    closeDbConnection(){
        if(this.dbConn !== null){
            this.dbConn.end();
        }
    }

    readFromDb(strQuery){
        return new Promise((resolve,reject) => {
          //this.dbConn.query('SELECT nFeedId, strFeedName AS name,strFeedValue AS value,strFeedCategory AS category, nAllowLookup FROM feedlist_table WHERE nActive = 1 ORDER BY category, name',
          this.dbConn.query(strQuery,
          (error, results, fields) => {
              if(error){
               return reject("ERROR - readFeedList Failed");
              }
              this.setJsonObj(JSON.stringify(results));
              return resolve("SUCCESS - readFeedList Success");
          });
        });
    }

    setJsonObj(theObj){
        this.jsonObj = theObj;
    }

    getJsonObj(){
        return this.jsonObj;
    }
        
}// End class OcsaDbServices

module.exports = OcsaDbServices;
