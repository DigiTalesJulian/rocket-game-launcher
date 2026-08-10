'use strict'

import { spawn } from 'child_process'
import { app, BrowserWindow, ipcMain, ipcRenderer } from 'electron'
import fs from 'fs'
import path from 'path'
import { format as formatUrl } from 'url'

import 'common/rocket';
import { MESSAGES } from 'common/messages';
import e from 'express'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({
    title: "Rocket Game Launcher",
    webPreferences: { nodeIntegration: true },
    fullscreen: true,
    autoHideMenuBar: true,
    kiosk: true
  })

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
    console.log(__dirname);
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})


// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()

  let AppIsRunning = false;
  let rocketFilePath = "";

  // remap ~ to rocketfilepath
  const resolveRelativeRocketPath = (path) => {
    return path.replace('~', rocketFilePath);
  }

  ipcMain.on(MESSAGES.LAUNCH_ROCKET,
    /**
     * @param {RocketProject} launchedRocket 
     */
    (event, launchedRocket) => {
      if (!AppIsRunning) {
        AppIsRunning = true
        const executablePath = resolveRelativeRocketPath(launchedRocket.executable);
        if (fs.existsSync(executablePath)) {
          console.log(`Launching rocket ${launchedRocket.description} via ${executablePath} (${launchedRocket.executable})`);
          spawn(executablePath).on("close", () => {
      console.log("here")

            AppIsRunning = false;
          });
        }
        else {
          console.log(`Unable to launch rocket`);
          console.log(launchedRocket);
          AppIsRunning = false;
        }
      }
      else {
        console.log("Another rocket is still running.")
      }
    })

  ipcMain.on(MESSAGES.OPEN_ROCKETFILE, (event, rocketFile) => {
    console.log("ping");
    console.log(rocketFile);

    if (!fs.existsSync(rocketFile)) {
      event.returnValue = 1;
      return;
    }

    rocketFilePath = path.dirname(rocketFile);

    /** @type RocketFile */
    const content = JSON.parse(fs.readFileSync(rocketFile));

    const loadImage = (imagePath) => {
      const _binaryImage = fs.readFileSync(imagePath).toString('base64');
      return `data:image/png;base64,${_binaryImage}`;
    };

    if (content.projects.length > 0) {
      content.projects = content.projects.map((project) => {
        const gameDir = path.dirname(resolveRelativeRocketPath(project.executable));

        const bannerPath = path.join(gameDir, 'banner.png');
        if (fs.existsSync(bannerPath)) {
          project.banner = loadImage(bannerPath);
        }

        const logoPath = path.join(gameDir, 'logo.png');
        if (fs.existsSync(logoPath)) {
          project.logo = loadImage(logoPath);
        }

        return project;
      });
      
      event.reply(MESSAGES.PROJECTS_LOADED, content.projects);
    }

    event.returnValue = 2;
  })
})



