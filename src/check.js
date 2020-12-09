module.exports = {
    Check: function Check(path) {
        
        let participantLogic = {
            "FRESH":[],
            "COMPLETED":['Completed'],
            "RECALL":['Rejected','NetworkBusy','FastBusy','DialerBusy','DialerFailed','Unknown','RemoteHangup','No Answer','NoAnswer','Answering Machine','AnswerMachine','Busy','Communication Difficulty'],
            "SILENT":['Silent','RemoteHangup'],
            "UNUSABLE":['UserDefTerm201','BusinessNumber','Rejected','NetworkBusy','FastBusy','Unknown','Abandoned','Fax','Wrong Number','WrongNumber','Disconnected','NotAvailable','LanguageBarrier','CommunicationDifficulty','HouseholdNumber','CompanyOutOfBusiness','UserDefTerm174','UserDefTerm175','UserDefTerm176','UserDefTerm177','UserDefTerm178','UserDefTerm203','UserDefTerm204','UserDefTerm205','UserDefTerm206','UserDefTerm207','UserDefTerm208','UserDefTerm209','UserDefTerm210','UserDefTerm211','UserDefTerm212','UserDefTerm217','UserDefTerm218','UserDefTerm250','UserDefTerm251','UserDefTerm253','UserDefTerm254','UserDefTerm255','UserDefTerm256','UserDefTerm257','UserDefTerm258','UserDefTerm261','UserDefTerm262','UserDefTerm263','UserDefTerm264','UserDefTerm265','UserDefTerm266','UserDefTerm267','UserDefTerm268','UserDefTerm269','UserDefTerm270','UserDefTerm271','UserDefTerm272','UserDefTerm273','UserDefTerm274','UserDefTerm275','UserDefTerm276','UserDefTerm277','UserDefTerm278','UserDefTerm279'],
            "CHECK_NUMBER":['PossibleWrongNumber'],
            "APPOINTMENT":['Appointment','SoftAppointment','Soft Appointment'],
            "REFUSED":['Refused','RefusedGatekeeper','RefusedCompanyPolicy','UserDefTerm170','UserDefTerm171','UserDefTerm172','UserDefTerm173'],
            "STOPPED":['Stopped'],
            "TIMED_OUT":['Stopped']
        }



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

        resultCH.CallHistory = resultCH.CallHistory.sort((a, b) => {
            let date1 = new Date(a.StartTime)
            let date2 = new Date(b.StartTime)
            return date1 - date2
        });

        let rowsCH = resultCH.CallHistory

        // Check the Participant Table
        rowsPT.forEach(y => {
            if (y.hasOwnProperty('Id') === false || y.hasOwnProperty('Queue') === false || 
                y.hasOwnProperty('TryCount') === false) {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"id,Queue and TryCount are required"}
                    obj['errorDescription'].push(er)
            }
            // if (typeof y.TryCount !== 'number') {
            if (isNaN(y.TryCount) === true) {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"TryCount is not a number"}
                    obj['errorDescription'].push(er)
            }
            if (y.Queue.toLowerCase() !== 'fresh') {
                if (y.TryCount < 1 && y.Queue.toLowerCase() !== 'timed_out') {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':"Queue is "+y.Queue+" then TryCount should be greather than 0"}
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
                // console.log(y.Queue.toUpperCase())
                if (participantLogic.hasOwnProperty(y.Queue.toUpperCase())) {
                    if (!participantLogic[y.Queue.toUpperCase()].includes(y.CallOutcome)) {
                        obj['numberOfErrors']++
                        let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':'"Mismatch between Queue and CallOutcome. Queue = '+y.Queue+' and CallOutcome = '+y.CallOutcome+'"'}
                        obj['errorDescription'].push(er)
                    }
                } else {
                    obj['numberOfErrors']++
                    let er = {'Type':"PT", 'Id':y.Id, 'row':rowsPT.indexOf(y)+2,'text':'"The Queue is unknown. Queue = '+y.Queue+'"'}
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
            if (x.Queue.toLowerCase() ==="fresh") {
                if (recCH.hasOwnProperty(x.Id)=== true) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id':x.Id,'text':"Queue is Fresh in Participant Table but has record in CallHistory"}
                    obj['errorDescription'].push(er)
                }
            } else {
                if (!recCH.hasOwnProperty(x.Id)) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id': x.Id,'text':"Queue in Participant Table is "+x.Queue+" but the records in CallHistory are missing."}
                    obj['errorDescription'].push(er)
                    return
                }
                let current = recCH[x.Id]
                if (current.UserId!==x.UserId) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id': x.Id,'text':"UserID not match in Participant Table and CallHistory"}
                    obj['errorDescription'].push(er)
                }
                if (isNaN(x.TryCount) === false) {
                    if (current.CallOutcome.length!==parseInt(x.TryCount)) {
                        obj['numberOfErrors']++
                        let er = {'Type': "Mrg", 'Id': x.Id,'text':"TryCount in Participant Table is "+x.TryCount+" but the number of records in CallHistory is "+current.CallOutcome.length}
                        obj['errorDescription'].push(er)
                    }
                }
                
                if (x.CallOutcome!==current.CallOutcome[current.CallOutcome.length -1]) {
                    obj['numberOfErrors']++
                    let er = {'Type': "Mrg", 'Id': x.Id,'text':"Last CallOutcome in CallHistory is "+current.CallOutcome[current.CallOutcome.length -1]+" but in Participant Table is " +x.CallOutcome}
                    obj['errorDescription'].push(er)
                }
                
            }
            delete recCH[x.Id]
        })
        for(let prop in recCH) {
            if(recCH.hasOwnProperty(prop)) {
                obj['numberOfErrors']++
                let er = {'Type': "Mrg", 'Id':prop,'text':"No record in Participant table for Id = "+prop}
                obj['errorDescription'].push(er)
            }
        }

        if (obj.numberOfErrors==0) {
            obj['lastStatus'] = 'The file is OK'
        }
        
        return obj


        
    },
    CheckSheetName: function CheckSheetName(path,target) {

        //Cell names to be checked
        let forCheck = {"Participants":['Id','Queue','CallOutcome','TryCount','UserId'],
                        "CallHistory":['Id','UserId','SampleId','StartTime','Duration','CallOutcome']}

        let countryes = ["AT","BE","BG","CY","CZ","DE","DK","EE","GR","ES","FI","FR","HR","HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK","GB","ME","MK","RS","CH","NO","AL","BA","XK"]
        // File names to be checked
        let fileNames = {
            "Participants":[],
            "CallHistory":[]
        }

        countryes.forEach(c => {
            fileNames[target].push(target+"_"+c+".xlsx")
        });


        let text = "Ok"

        let name = path.split("\\").pop()

        if (!fileNames[target].includes(name)) {
            text = 'Wrong file name. Should be: "' + target+'_XX.xlsx" - where XX is the country code.'
            return text
        }

        let result = excelToJson({
            source: fs.readFileSync(path),
            header:{
                rows: 1
            },
            columnToKey: {
                '*': '{{columnHeader}}'
            },
            includeEmptyLines: true
        });
        
        let rows = result[target]
        

        


        if (!result.hasOwnProperty(target)) {
            text = 'Wrong sheet name. Should be ' + target
            return text
        }
        let out =[]

        rows.shift()

        forCheck[target].forEach(e => {
            if (rows.filter((o) => o.hasOwnProperty(e)).length === 0){
                out.push(e)
            }
        });
        if (out.length>0) {
            text = "Missing columns: "+ out.toString()
        }

        if (rows.includes(undefined)) {
            text = "Please remove the empty rows and try again."
        }

        return text

    },
    CheckAccess: function CheckAccess(user,pasw,div,loader,upl) {
        const Client = require('ssh2-sftp-client');

        const config = {
            host: 'uksftp.ipsos.com',
            port: 22,
            retries: 1,
            username: user,
            password: pasw
          };
          
          
        let client = new Client();

        client.connect(config)
            .then(() => {
                div.innerHTML = "<h3>You have access to the secure folder</h3>"
                loader.hidden = true
                return client.end();
            })
            .catch(err => {
                if (err.message=='connect: All configured authentication methods failed after 1 attempt') {
                    div.innerHTML = '<h3 id="customerror">Login failed. Invalid username or password</h3>'
                    upl.hidden = false
                } else if(err.message=='connect: Timed out while waiting for handshake after 1 attempt'){
                    div.innerHTML = '<h3 id="customerror">Could not connect to the Server</h3>'
                } else if (err.message=='connect: client-socket error. Remote host at 78.136.2.44 refused connection after 1 attempt'){
                    div.innerHTML = '<h3 id="customerror">Could not connect to the Server</h3>'
                } else {
                    div.innerHTML = '<h3 id="customerror">'+err.message+'</h3>'
                }
                
                loader.hidden = true
                console.error(err.message);
                console.error(err);
            });
        
            client.on('end',() => {setTimeout(function(){ myTimer(div,loader) }, 30000)})
            
            function myTimer(div,loader,upl) {
                if (div.innerHTML === '') {
                    div.innerHTML = "<h3>Could not connect to the Server</h3>"
                    loader.hidden = true
                }
                div.hidden = false
                return {div, loader}
           }
            div.hidden = false
            return {div, loader, upl}

    },
    SendFile: function SendFile(user,pasw,fs,div,loader, upl) {

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
                return client.put(dataPT, remotePT);
            })
            .then(() => {
                return client.put(dataCH, remoteCH);
            })
            .then(() => {
                div.innerHTML = "<h3>Files Uploaded</h3>"
                loader.hidden = true
                return client.end();
            })
            .catch(err => {
                dataPT.close()
                dataCH.close()
                if (err.message=='connect: All configured authentication methods failed after 1 attempt') {
                    div.innerHTML = '<h3 id="customerror">Login failed. Invalid username or password</h3>'
                    upl.hidden = false
                } else if(err.message=='connect: Timed out while waiting for handshake after 1 attempt'){
                    div.innerHTML = '<h3 id="customerror">Could not connect to the Server</h3>'
                } else if (err.message=='connect: client-socket error. Remote host at 78.136.2.44 refused connection after 1 attempt'){
                    div.innerHTML = '<h3 id="customerror">Could not connect to the Server</h3>'
                } else {
                    div.innerHTML = '<h3 id="customerror">'+err.message+'</h3>'
                }
                
                loader.hidden = true
                console.error(err.message);
                console.error(err);
            });
        
            client.on('end',() => {setTimeout(function(){ myTimer(div,loader) }, 30000)})
            
            function myTimer(div,loader,upl) {
                if (div.innerHTML === '') {
                    div.innerHTML = "<h3>Could not connect to the Server</h3>"
                    loader.hidden = true
                }
                
                return {div, loader}
           }

            return {div, loader, upl}
    }



}