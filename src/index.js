const electron = require('electron'); 
const path = require('path'); 
const fs = require('fs');
const excelToJson = require('convert-excel-to-json');

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

let uploadFile2 = document.getElementById('upload2'); 

// Defining a Global file path Variable to store 
// user-selected file 
// global.filepath = undefined; 

if (!global.hasOwnProperty('filepath')) {
	global.filepath = {"Default": path.join(__dirname, '') }
}

uploadFile.addEventListener('click', () => { 
        
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
					text.innerText = "File Ready"
				} else {
					text.innerText = result
				}


				if (uploadFile.hidden===true && uploadFile2.hidden===true) {
					text.innerText = "Check the files"
					text2.hidden = true
					checker.hidden = false
				}
				
				
				// global.filepath = file.filePaths[0].toString(); 
				// console.log(global.filepath); 
				} 
			}).catch(err => { 
				console.log(err) 
			}); 
		} 
}); 


uploadFile2.addEventListener('click', () => { 
        
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
				
				result = CheckSheetName(global.filepath.CH,"Sheet1")
				
				if (result==="Ok") {
					uploadFile2.hidden = true
					text2.innerText = "File Ready"
				} else {
					text2.innerText = result
				}


				if (uploadFile.hidden===true && uploadFile2.hidden===true) {
					text.innerText = "Check the files"
					text2.hidden = true
					checker.hidden = false
				}
				
				
				
				// global.filepath = file.filePaths[0].toString(); 
				// console.log(global.filepath); 
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
		
		div.innerHTML = "<h3>Error/s Found</h3>"
		CreateTable(result)
		// div.appendChild(tbl)
		
	}else if (result['lastStatus']!=="The file is OK") {
		div.innerHTML = ""
		div.innerHTML = "<h3>" + result['lastStatus'] + "</h3>"
	} else {
		div.innerHTML = "<h3>The Files are OK. Please use your user name and password to upload them.</h3>"
		upl.hidden = false
		text.hidden = true
	}

})


but.addEventListener('click', () => {
					
	let userName = document.getElementById('usrname').value
	let psw = document.getElementById('psw').value
	
	if (userName==="" || psw==="") {
		text.hidden = false
		text.innerHTML = "<h3>Username and password are mandatory!</h3>"
	} else {
		loader.hidden = false
		text.hidden = true
		upl.hidden = true
		SendFile(userName,psw,global.filepath,fs,div,loader)
		
	}
})	




function CreateTable(data) {
	
	
	if (data['errorDescription'].filter(x=>x.Type === "PT").length>0) {
		
		let stream = fs.createWriteStream(path.join(__dirname, '/Participant.csv'))
		stream.write("Id,row,Error Descriptions"+"\r\n")
		let err = data['errorDescription'].filter(x=>x.Type === "PT")
		err.forEach(x=>{
			stream.write(x.Id+","+x.row+","+x.text+"\r\n")
		})
		stream.end()
	}
	if (data['errorDescription'].filter(x=>x.Type === "CH").length>0) {
		
		let stream = fs.createWriteStream(path.join(__dirname, '/CallHistory.csv'))
		stream.write("SampleId,Id,Error Descriptions"+"\r\n")
		let err = data['errorDescription'].filter(x=>x.Type === "CH")
		err.forEach(x=>{
			stream.write(x.SampleId+","+x.Id+","+x.text+"\r\n")
		})
		stream.end()
	}
	if (data['errorDescription'].filter(x=>x.Type === "Mrg").length>0) {
		
		let stream = fs.createWriteStream(path.join(__dirname, '/Participant VS CallHistory.csv'))
		stream.write("Id,Error Descriptions"+"\r\n")
		let err = data['errorDescription'].filter(x=>x.Type === "Mrg")
		err.forEach(x=>{
			stream.write(x.Id+","+x.text+"\r\n")
		})
		stream.end()
	}
	

}
