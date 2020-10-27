module.exports = {
    Check: function Check(path) {

        let obj = {
                    'numberOfErrors':0,
                    'lastStatus': "",
                    'errorDescription':[]
                    }

        const result = excelToJson({
            source: fs.readFileSync(path),
            header:{
                rows: 1
            },
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        });
        
        if (!result.hasOwnProperty('Participants')) {
            obj['lastStatus'] = 'Wrong sheet name. Should be "Participants"'
            return obj
        }

        let rows = result.Participants
        if (rows.filter((o) => o.hasOwnProperty('Id')).length === 0
            || rows.filter((o) => o.hasOwnProperty('Queue')).length === 0
            || rows.filter((o) => o.hasOwnProperty('CallOutcome')).length === 0
            || rows.filter((o) => o.hasOwnProperty('TryCount')).length === 0
            || rows.filter((o) => o.hasOwnProperty('UserId')).length === 0
        ){
            obj['lastStatus'] = 'Missing column. Please use the template'
            return obj
        }
        
        rows.forEach(y => {
            if (y.hasOwnProperty('Id') === false || y.hasOwnProperty('Queue') === false || 
                y.hasOwnProperty('TryCount') === false) {
                    obj['numberOfErrors']++
                    let er = {'Id':y.Id, 'row':rows.indexOf(y)+2,'text':"id,Queue and TryCount are required"}
                    obj['errorDescription'].push(er)
            }
            if (typeof y.TryCount !== 'number') {
                    obj['numberOfErrors']++
                    let er = {'Id':y.Id, 'row':rows.indexOf(y)+2,'text':"TryCount is not a number"}
                    obj['errorDescription'].push(er)
            }
            if (y.Queue.toLowerCase() !== 'fresh') {
                if (y.TryCount < 1) {
                    obj['numberOfErrors']++
                    let er = {'Id':y.Id, 'row':rows.indexOf(y)+2,'text':"TryCount should be greather than 0"}
                    obj['errorDescription'].push(er)
                }
            if (y.hasOwnProperty('CallOutcome') === false) {
                    obj['numberOfErrors']++
                    let er = {'Id':y.Id, 'row':rows.indexOf(y)+2,'text':"Missing CallOutcome"}
                    obj['errorDescription'].push(er)
            }
            if (y.hasOwnProperty('UserId') === false) {
                obj['numberOfErrors']++
                let er = {'Id':y.Id, 'row':rows.indexOf(y)+2,'text':"Missing UserID"}
                obj['errorDescription'].push(er)
            }
            }
            if (y.TryCount>50) {
                obj['numberOfErrors']++
                let er = {'Id':y.Id, 'row':rows.indexOf(y)+2,'text':"TryCount should be less than 50"}
                obj['errorDescription'].push(er)
            }
        });
        if (obj.numberOfErrors==0) {
            obj['lastStatus'] = 'The file is OK'
        }
        return obj


        
    },
    SendFile: function SendFile(user,pasw,fileName,fs,div,loader) {

        const Client = require('ssh2-sftp-client');

        const config = {
            host: 'uksftp.ipsos.com',
            port: 22,
            retries: 1,
            username: user,
            password: pasw
          };
          
        let client = new Client();

        let data = fs.createReadStream(global.filepath);
        // let data = global.filepath;
        let remote = '/home/test.xlsx';
       
        client.connect(config)
            .then(() => {
                console.log("Hello")
                return client.put(data, remote);
            })
            .then(() => {
                div.innerHTML = "<h3>File Uploaded</h3>"
                loader.hidden = true
                return client.end();
            })
            .catch(err => {
                data.close()
                div.innerHTML = "<h3>"+err.message+"</h3>"
                loader.hidden = true
                console.error(err.code);
            });
            
            // div.innerHTML = "<h3>"+JSON.stringify(client)+"</h3>"
            // loader.hidden = true
            return {div, loader}
    }
}