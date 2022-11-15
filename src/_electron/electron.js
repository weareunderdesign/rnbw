// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')

// Window Variable
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    // show: false, // hide the main window at startup
  })

  // load the index.html of the app.
  mainWindow.loadFile('index.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const { dialog, ipcMain } = require('electron')

let options = {
  title: "Import Project", // Dialog Title
  defaultPath: "E:\\", // Dialog Default Path
  buttonLabel: "Select Root Folder", // Select Folder Button Label

  // Open File Dialog Case
  // See place holder 4 in above image
  /* filters: [
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
    { name: 'Custom File Type', extensions: ['as'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  properties: ['openFile', 'multiSelections'] */

  properties: ['openDirectory'],
}

ipcMain.on('open-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  console.log('directory selected', result.filePaths[0])
  app.quit()
})