const electron = require('electron'); 
const path = require('path'); 
const fs = require('fs');
const excelToJson = require('convert-excel-to-json');
const homeDir = require('path').join(require('os').homedir(), 'Desktop')


let { Check,SendFile,CheckSheetName } = require("./check");

// Importing dialog module using remote 
const dialog = electron.remote.dialog; 

let uploadFile = document.getElementById('upload'); 
let checker = document.getElementById('check')
let div = document.getElementById('result')
let upl = document.getElementById('upl')
let but = document.getElementById('submit')
let loader = document.getElementById('load')
let text = document.getElementById('text')
let text2 = document.getElementById('text2')
let errPT = document.getElementById('errorPT')
let errCH = document.getElementById('errorCH')


let uploadFile2 = document.getElementById('upload2'); 

// Defining a Global file path Variable to store 
// user-selected file 
// global.filepath = undefined; 

if (!global.hasOwnProperty('filepath')) {
	global.filepath = {"Default": path.join(__dirname, '') }
}

uploadFile.addEventListener('click', () => { 
		uploadFile.hidden = true
		errPT.hidden = true
		text.innerText = "Loadaing.."
	// If the platform is 'win32' or 'Linux' 
		if (process.platform !== 'darwin') { 
			// Resolves to a Promise<Object> 
			dialog.showOpenDialog({ 
				title: 'Select Participant Table File', 
				defaultPath: path.join(__dirname, ''), 
				buttonLabel: 'Upload', 
				// Restricting the user to only Text Files. 
				filters: [ 
					{ 
						name: 'Participant Table File', 
						extensions: ['xlsx'] 
					}, ], 
				// Specifying the File Selector Property 
				properties: ['openFile','multiSelections'] 
			}).then(file => { 
				// Stating whether dialog operation was 
				// cancelled or not. 
				console.log(file.canceled); 
				if (!file.canceled) { 
				// Updating the GLOBAL filepath variable 
				// to user-selected file. 
				let result = null
				

				global.filepath.PT = file.filePaths[0].toString();
				
				
				result = CheckSheetName(global.filepath.PT,"Participants")
				
				if (result==="Ok") {
					uploadFile.hidden = true
					text.innerText = "Participant Table File is Ready"
				} else {
					uploadFile.hidden = false
					text.innerText = "Select Participant Table File"
					errPT.hidden = false
					errPT.innerText = result
				}


				if (uploadFile.hidden===true && uploadFile2.hidden===true) {
					text.innerText = "Perform preliminary validation for correspondence between participant table and call history files"
					text2.hidden = true
					checker.hidden = false
				}
				
				
				// global.filepath = file.filePaths[0].toString(); 
				// console.log(global.filepath); 
				} else {
					uploadFile.hidden = false
					text.innerText = "Select Participant Table File"
					errPT.hidden = false
				}
			}).catch(err => { 
				console.log(err) 
			}); 
		} 
}); 


uploadFile2.addEventListener('click', () => { 
		uploadFile2.hidden = true
		errCH.hidden = true
		text2.innerText = "Loadaing.."
	// If the platform is 'win32' or 'Linux' 
		if (process.platform !== 'darwin') { 
			// Resolves to a Promise<Object> 
			dialog.showOpenDialog({ 
				title: 'Select Call History File', 
				defaultPath: path.join(__dirname, ''), 
				buttonLabel: 'Upload', 
				// Restricting the user to only Text Files. 
				filters: [ 
					{ 
						name: 'Call History Files', 
						extensions: ['xlsx'] 
					}, ], 
				// Specifying the File Selector Property 
				properties: ['openFile','multiSelections'] 
			}).then(file => { 
				// Stating whether dialog operation was 
				// cancelled or not. 
				
				

				console.log(file.canceled); 
				if (!file.canceled) { 
				// Updating the GLOBAL filepath variable 
				// to user-selected file. 
				let result = null
				
				
				
				global.filepath.CH = file.filePaths[0].toString();
				
				result = CheckSheetName(global.filepath.CH,"CallHistory")
				
				if (result==="Ok") {
					uploadFile2.hidden = true
					text2.innerText = "Call History File Ready"
				} else {
					uploadFile2.hidden = false
					text2.innerText = "Select Call History File"
					errCH.hidden = false
					errCH.innerText = result
				}


				if (uploadFile.hidden===true && uploadFile2.hidden===true) {
					text.innerText = "Perform preliminary validation for correspondence between participant table and call history files"
					text2.hidden = true
					checker.hidden = false
				}
				
				
				
				// global.filepath = file.filePaths[0].toString(); 
				// console.log(global.filepath); 
				} else {
					uploadFile2.hidden = false
					text2.innerText = "Select Call History File"
					errCH.hidden = false
				}
			}).catch(err => { 
				console.log(err) 
			}); 
		} 
}); 

checker.addEventListener('click', () => { 
	
	checker.hidden = true
	text.hidden = true
	let result = null
	result = Check(global.filepath)

	if (result['lastStatus']==="") {
		
		let sumary = CreateTable(result)
		if (sumary.files===1) {
			div.innerHTML = "<h3>"+result.numberOfErrors+" Errors Found. "+sumary.files+" file created on your desktop. Name: "+sumary.names.toString()+"</h3>"
		} else {
			div.innerHTML = "<h3>"+result.numberOfErrors+" Errors Found. "+sumary.files+" files created on your desktop. Names: "+sumary.names.toString()+"</h3>"
		}
		// div.appendChild(tbl)
		
	}else if (result['lastStatus']!=="The file is OK") {
		div.innerHTML = ""
		div.innerHTML = "<h3>" + result['lastStatus'] + "</h3>"
	} else {
		div.innerHTML = "<h3>File validation is completed. No issues found</h3>"
		upl.hidden = false
		// text.hidden = false
		// text.innerText = "Please provide login information for SFTP upload of validated files to Ipsos"
	}

})


but.addEventListener('click', () => {
					
	let userName = document.getElementById('usrname').value
	let psw = document.getElementById('psw').value
	
	if (userName==="" || psw==="") {
		text.hidden = false
		text.innerHTML = '<h3 id="customerror">Username and password are required!</h3>'
	} else {
		loader.hidden = false
		text.hidden = true
		upl.hidden = true
		SendFile(userName,psw,fs,div,loader,upl)
		document.getElementById('usrname').value = ""
		document.getElementById('psw').value = ""
	}

	
})	




function CreateTable(data) {
	
	let result = {'files':0, 'names':[]}
	if (data['errorDescription'].filter(x=>x.Type === "PT").length>0) {
		result.files++
		result.names.push("Participant.csv")
		let stream = fs.createWriteStream(homeDir +'/Participant.csv')
		stream.write("Id,row,Error Descriptions"+"\r\n")
		let err = data['errorDescription'].filter(x=>x.Type === "PT")
		err.forEach(x=>{
			stream.write(x.Id+","+x.row+","+x.text+"\r\n")
		})
		stream.end()
	}
	if (data['errorDescription'].filter(x=>x.Type === "CH").length>0) {
		result.files++
		result.names.push("CallHistory.csv")
		let stream = fs.createWriteStream(homeDir +'/CallHistory.csv')
		stream.write("SampleId,Id,Error Descriptions"+"\r\n")
		let err = data['errorDescription'].filter(x=>x.Type === "CH")
		err.forEach(x=>{
			stream.write(x.SampleId+","+x.Id+","+x.text+"\r\n")
		})
		stream.end()
	}
	if (data['errorDescription'].filter(x=>x.Type === "Mrg").length>0) {
		result.files++
		result.names.push("Participant VS CallHistory.csv")
		let stream = fs.createWriteStream(homeDir +'/Participant VS CallHistory.csv')
		stream.write("Id,Error Descriptions"+"\r\n")
		let err = data['errorDescription'].filter(x=>x.Type === "Mrg")
		err.forEach(x=>{
			stream.write(x.Id+","+x.text+"\r\n")
		})
		stream.end()
	}
	
	return result
}
