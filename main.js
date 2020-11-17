const { app, BrowserWindow, ipcMain, Menu } = require('electron') 

const { autoUpdater } = require('electron-updater');

let win

function sendStatusToWindow(text) {
	log.info(text);
	win.webContents.send('message', text);
  }

function createWindow () { 

win = new BrowserWindow({ 
	width: 800, 
	height: 600, 
	webPreferences: { 
		nodeIntegration: true,
		plugins: true
	}
}) 
// win.setMenuBarVisibility(false)


win.loadFile('src/index.html') 



//   win.webContents.openDevTools() 

} 


app.whenReady().then(createWindow) 


app.on('window-all-closed', () => { 

if (process.platform !== 'darwin') { 
	app.quit() 
} 
}) 

app.on('activate', () => { 

if (BrowserWindow.getAllWindows().length === 0) { 
	createWindow() 
} 
}) 

app.on('ready', () => {
	const menu = Menu.buildFromTemplate([
		{
			label: 'Menu',
			submenu: [
			{
				label: 'Help',
				click: function() {
					win.loadURL("https://www.ipsos.com/"); 
					// win.loadFile('src/test.pdf')
					// TO DO
				}
			},
			{
				label: 'Restart',
				click: function(){
					win.loadFile('src/index.html') 
				}
			}
			]
		}
	])
	Menu.setApplicationMenu(menu)
  })

ipcMain.on('app_version', (event) => {
	event.sender.send('app_version', { version: app.getVersion() });
  });

  autoUpdater.checkForUpdatesAndNotify();;

  autoUpdater.on('update-available', () => {
	win.webContents.send('update_available');
	console.log("Here")
  });
  autoUpdater.on('update-downloaded', () => {
	win.webContents.send('update_downloaded');
	console.log("Here1")
  });

  autoUpdater.on('update-not-available', function (info) {
	console.log("Here2")
	sendStatusToWindow('Update not available.');
	
});

  ipcMain.on('restart_app', () => {
	autoUpdater.quitAndInstall();
  });

