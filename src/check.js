module.exports = {
    Check: function Check(path) {
        
        let obj = {
                    'numberOfErrors':0,
                    'lastStatus': "",
                    'errorDescription':[]
                    }

        const result = excelToJson({
            source: fs.readFileSync(path.PT),
            header:{
                rows: 1
            },
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        });
        
        const resultCH = excelToJson({
            source: fs.readFileSync(path.CH),
            header:{
                rows: 1
            },
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        });

        

        let rowsPT = result.Participants

        resultCH.Sheet1 = resultCH.Sheet1.sort((a, b) => {
            let date1 = new Date(a.StartTime)
            let date2 = new Date(b.StartTime)
            return date1 - date2
        });

        let rowsCH = resultCH.Sheet1

        // Check the Participant Table
        rowsPT.forEach(y => {
            if (y.hasOwnProperty('Id') === false || y.hasOwnProperty('Queue') === false || 
                y.hasOwnProperty('TryCount') === false) {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"id,Queue and TryCount are required"}
                    obj['errorDescription'].push(er)
            }
            if (typeof y.TryCount !== 'number') {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"TryCount is not a number"}
                    obj['errorDescription'].push(er)
            }
            if (y.Queue.toLowerCase() !== 'fresh') {
                if (y.TryCount < 1) {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"TryCount should be greather than 0"}
                    obj['errorDescription'].push(er)
                }
                if (y.hasOwnProperty('CallOutcome') === false) {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"Missing CallOutcome"}
                    obj['errorDescription'].push(er)
                }
                if (y.hasOwnProperty('UserId') === false) {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"Missing UserID"}
                    obj['errorDescription'].push(er)
                }
            }
            if (y.TryCount>50) {
                obj['numberOfErrors']++
                let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"TryCount should be less than 50"}
                obj['errorDescription'].push(er)
            }
        });
        
        // Check The Call History Table
        
        let recCH = {}

        // y.hasOwnProperty('Duration') === false || 
        rowsCH.forEach(y => {
            if (y.hasOwnProperty('Id') === false || y.hasOwnProperty('UserId') === false || 
                y.hasOwnProperty('SampleId') === false || y.hasOwnProperty('StartTime') === false ||
                y.hasOwnProperty('CallOutcome') === false) {
                    obj['numberOfErrors']++
                    let er = {'Type': "CH", 'SampleId':y.SampleId, 'Id':y.Id,'text':"id UserId SampleId StartTime and CallOutcome are required"}
                    obj['errorDescription'].push(er)
            }

            
                if (!recCH.hasOwnProperty(y.SampleId)) {
                    recCH[y.SampleId] = {
                        'Id': [y.Id],
                        'UserId': y.UserId,
                        'StartTime': [y.StartTime],
                        'Duration': y.Duration,
                        'CallOutcome': [y.CallOutcome]
                    }
                } else {
                    
                    recCH[y.SampleId].Id.push(y.Id)
                    recCH[y.SampleId].UserId = y.UserId
                    recCH[y.SampleId].StartTime.push(y.StartTime)
                    recCH[y.SampleId].Duration+= y.Duration
                    recCH[y.SampleId].CallOutcome.push(y.CallOutcome)
                }
            
        })

        // TO DO check Call History sorted file

        rowsPT.forEach(x => {
            if (x.Queue==="Fresh") {
                if (recCH.hasOwnProperty(x.Id)=== true) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id':x.Id,'text':"Fresh in PT but has record in CH"}
                    obj['errorDescription'].push(er)
                }
            } else {
                if (!recCH.hasOwnProperty(x.Id)) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id': x.Id,'text':"Missing in CH"}
                    obj['errorDescription'].push(er)
                    return
                }
                let current = recCH[x.Id]
                if (current.UserId!==x.UserId) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id': x.Id,'text':"UserID not match in PT and CH"}
                    obj['errorDescription'].push(er)
                }
                if (current.CallOutcome.length!==x.TryCount) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id': x.Id,'text':"Try count in PT and the number of records in CH not match"}
                    obj['errorDescription'].push(er)
                }
                if (x.CallOutcome!==current.CallOutcome[current.CallOutcome.length -1]) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id': x.Id,'text':"Last CallOutcome in CH not match PT"}
                    obj['errorDescription'].push(er)
                }
                
            }
            delete recCH[x.Id]
        })
        for(let prop in recCH) {
            if(recCH.hasOwnProperty(prop)) {
                obj['numberOfErrors']++
                let er = {'Type': "Mrg", 'Id':prop,'text':"Missing in PT"}
                obj['errorDescription'].push(er)
            }
        }

        if (obj.numberOfErrors==0) {
            obj['lastStatus'] = 'The file is OK'
        }
        
        return obj


        
    },
    CheckSheetName: function CheckSheetName(path,target) {
        let result = excelToJson({
            source: fs.readFileSync(path),
            header:{
                rows: 1
            },
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        });
        let text = "Ok"
        let rows = result[target]

        if (!result.hasOwnProperty(target)) {
            text = 'Wrong sheet name. Should be ' + target
            return text
        }

        if (target==="Participants") {
            if (rows.filter((o) => o.hasOwnProperty('Id')).length === 0
            || rows.filter((o) => o.hasOwnProperty('Queue')).length === 0
            || rows.filter((o) => o.hasOwnProperty('CallOutcome')).length === 0
            || rows.filter((o) => o.hasOwnProperty('TryCount')).length === 0
            || rows.filter((o) => o.hasOwnProperty('UserId')).length === 0
                ){
                    text = 'Missing column. Please use the template'
            
                }  
        } else if (target==="Sheet1") {
            if (rows.filter((o) => o.hasOwnProperty('Id')).length === 0
            || rows.filter((o) => o.hasOwnProperty('UserId')).length === 0
            || rows.filter((o) => o.hasOwnProperty('SampleId')).length === 0
            || rows.filter((o) => o.hasOwnProperty('StartTime')).length === 0
            || rows.filter((o) => o.hasOwnProperty('Duration')).length === 0
            || rows.filter((o) => o.hasOwnProperty('CallOutcome')).length === 0
                ){
                    text = 'Missing column. Please use the template'
            
                }  
        }

        return text

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

        let dataPT = fs.createReadStream(global.filepath.PT);
        
        let remotePT = '/home/'+global.filepath.PT.split("\\").pop()

        let dataCH = fs.createReadStream(global.filepath.CH);
        
        let remoteCH = '/home/'+global.filepath.CH.split("\\").pop()
       
        div.innerHTML = ""

        
            
            client.connect(config)
            .then(() => {
                console.log("Hello PT")
                return client.put(dataPT, remotePT);
            })
            .then(() => {
                console.log("Hello CH")
                return client.put(dataCH, remoteCH);
            })
            .then(() => {
                div.innerHTML = "<h3>Files Uploaded</h3>"
                loader.hidden = true
                return client.end();
            })
            .catch(err => {
                data.close()
                div.innerHTML = "<h3>"+err.message+"</h3>"
                loader.hidden = true
                console.error(err.code);
            });
            
            client.on('end',() => {setTimeout(function(){ myTimer(div,loader) }, 30000)})
            
            function myTimer(div,loader) {
                if (div.innerHTML === '') {
                    div.innerHTML = "<h3>Could not connect to the Server</h3>"
                    loader.hidden = true
                    return {div, loader}
                }
           }

            return {div, loader}
    }
}