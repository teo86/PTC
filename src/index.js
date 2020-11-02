const electron = require('electron'); 
const path = require('path'); 
const fs = require('fs');
const excelToJson = require('convert-excel-to-json');

let { Check,SendFile } = require("./check");

// Importing dialog module using remote 
const dialog = electron.remote.dialog; 

let uploadFile = document.getElementById('upload'); 
let checker = document.getElementById('check')
let div = document.getElementById('result')
let upl = document.getElementById('upl')
let but = document.getElementById('submit')
let loader = document.getElementById('load')
let text = document.getElementById('text')

// Defining a Global file path Variable to store 
// user-selected file 
// global.filepath = undefined; 

uploadFile.addEventListener('click', () => { 
        
// If the platform is 'win32' or 'Linux' 
	if (process.platform !== 'darwin') { 
		// Resolves to a Promise<Object> 
		dialog.showOpenDialog({ 
			title: 'Select the File', 
			defaultPath: path.join(__dirname, '../assets/'), 
			buttonLabel: 'Upload', 
			// Restricting the user to only Text Files. 
			filters: [ 
				{ 
					name: 'Text Files', 
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
			global.filepath = undefined
			global.filepath = file.filePaths[0].toString();
			// fileName = file.filePaths[0].toString()
			result = Check(global.filepath)
			
			// console.log(fileName)
			
			uploadFile.hidden = true
    		checker.hidden = false;
			
			checker.addEventListener('click', () => { 
                uploadFile.hidden = false
				checker.hidden = true
				// upl.hidden = true
				// console.log(result)
				
				
				if (result['lastStatus']==="") {
					div.innerHTML = ""
					let tbl = CreateTable(result)
					div.appendChild(tbl)
					file.filePaths[0] = undefined
				}else if (result['lastStatus']!=="The file is OK") {
					div.innerHTML = ""
					div.innerHTML = "<h3>" + result['lastStatus'] + "</h3>"
					file.filePaths[0] = undefined
				} else {
					div.innerHTML = ""
					upl.hidden = false
					uploadFile.hidden = true
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
			
			
			// global.filepath = file.filePaths[0].toString(); 
			// console.log(global.filepath); 
			} 
		}).catch(err => { 
			console.log(err) 
		}); 
	} 


	// else { 
	// 	// If the platform is 'darwin' (macOS) 
	// 	dialog.showOpenDialog({ 
	// 		title: 'Select the File to be uploaded', 
	// 		defaultPath: path.join(__dirname, '../assets/'), 
	// 		buttonLabel: 'Upload', 
	// 		filters: [ 
	// 			{ 
	// 				name: 'Text Files', 
	// 				extensions: ['txt', 'docx'] 
	// 			}, ], 
	// 		// Specifying the File Selector and Directory 
	// 		// Selector Property In macOS 
	// 		properties: ['openFile', 'openDirectory'] 
	// 	}).then(file => { 
	// 		console.log(file.canceled); 
	// 		if (!file.canceled) { 
	// 		global.filepath = file.filePaths[0].toString(); 
	// 		console.log(global.filepath); 
	// 		} 
	// 	}).catch(err => { 
	// 		console.log(err) 
	// 	}); 
	// } 
}); 


function CreateTable(data) {
	let tbl = document.createElement('table');
	let arr = ["Id","row","text"]
	let header = tbl.createTHead()
	let row = header.insertRow(0)
	let cell1 = row.insertCell(0)
	cell1.innerHTML = "<b>Id</b>"
	let cell2 = row.insertCell(1)
	cell2.innerHTML = "<b>Row</b>"
	let cell3 = row.insertCell(2)
	cell3.innerHTML = "<b>Description</b>"

	let tableBody = document.createElement('tbody');

	data['errorDescription'].forEach(function(rowData) {
	  let row = document.createElement('tr');
		
	  
	  arr.forEach(function(cellData) {
		let cell = document.createElement('td');
		cell.appendChild(document.createTextNode(rowData[cellData]));
		row.appendChild(cell);
	  });
  
	  tableBody.appendChild(row);
	});
  
	tbl.appendChild(tableBody);



	return tbl
}
