var fs = require('fs');

export default class OcsaUtils{

    constructor(){
      this.m_strLogFile = "ocsa_feed.log";  
    }

    writeToLog(strLogMsg){
        fs.writeFile(this.m_strLogFile, strLogMsg, (err) => {
            if(err){
                console.log(`ERROR Writing File = ${err}`);
            }else{
                console.log(`SUCCESS WRITING FILE.`);
            }
        });
    }
}
