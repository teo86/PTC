// const electron = require('electron'); 
const fs = require('fs');


let { CheckAccess } = require("./check");

let upl = document.getElementById('upl')
let but = document.getElementById('submit')
let loader = document.getElementById('load')
let div = document.getElementById('result')



but.addEventListener('click', () => {
					
	let userName = document.getElementById('usrname').value
	let psw = document.getElementById('psw').value
	
	if (userName==="" || psw==="") {
		div.hidden = false
		div.innerHTML = '<h3 id="customerror">Username and password are required!</h3>'
	} else {
        loader.hidden = false
        div.innerHTML = ''
		div.hidden = true
		upl.hidden = true
		CheckAccess(userName,psw,div,loader,upl)
		document.getElementById('usrname').value = ""
		document.getElementById('psw').value = ""
	}

	
})	