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
                //database: 'chat_news'
                database: 'chat_news_test'
            });   
            // Connect to database
            this.dbConn.connect();
            return true; 
        }else{
            return false;
        }
    }

    closeDbConnection(){
        if(this.dbConn !== null){
            this.dbConn.end();
            this.dbConn = null;
        }
        return false;
    }


    readValueFromDb(strKey,strQuery){
        return new Promise((resolve,reject) => {
          //this.dbConn.query('SELECT nFeedId, strFeedName AS name,strFeedValue AS value,strFeedCategory AS category, nAllowLookup FROM feedlist_table WHERE nActive = 1 ORDER BY category, name',
            if(this.dbConn !== null){
                this.dbConn.query(strQuery,
                (error, results, fields) => {
                    if(error){
                    return reject(`ERROR - readFeedList Failed due to ${error}` );
                    }
                    //var rows = JSON.parse(JSON.stringify(results[0]));
                    //console.log(`rows = ${results[0].nFeedId}`);
                    if(results.length > 0){
                        return resolve(true);
                    }else{
                        return resolve(false);
                    }
                });
            }else{
                return reject(`ERROR:readFromDb = dbConn is not open`);
            }
        });
    }

    readFromDb(strQuery){
        return new Promise((resolve,reject) => {
          //this.dbConn.query('SELECT nFeedId, strFeedName AS name,strFeedValue AS value,strFeedCategory AS category, nAllowLookup FROM feedlist_table WHERE nActive = 1 ORDER BY category, name',
            if(this.dbConn !== null){
                this.dbConn.query(strQuery,
                (error, results, fields) => {
                    if(error){
                    return reject(`ERROR - readFeedList Failed due to ${error}` );
                    }
                    this.setJsonObj(JSON.stringify(results));
                    return resolve(true);
                });
            }else{
                return reject(`ERROR:readFromDb = dbConn is not open`);
            }
        });
    }

    async writeToDb(strQuery){
        return new Promise((resolve,reject) => {
            if(this.dbConn !== null){
            this.dbConn.query(strQuery,
            (error, results, fields) => {
                if(error){
                return reject(`ERROR - writeToDbFailed, ${error}`);
                }
                //this.setJsonObj(JSON.stringify(results));
                return resolve(true);
                });
            }else{
                return reject("ERROR:writeToDb = dbConn is not open");
            }
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
