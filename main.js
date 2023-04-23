const {app, BrowserWindow, Menu, Tray, nativeImage, dialog} = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const url = require("url");
const iconPath = path.join(__dirname, "icon.png");

function createWindow() {
  const win = new BrowserWindow({
    icon: iconPath,
    width: 1024,
    height: 720,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("https://chat.openai.com/");
  const tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([{ role: "quit", label: "Quit" }]);
  tray.setToolTip("ChatGPT"), tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });
  var splash = new BrowserWindow({
    icon: iconPath,
    width: 520,
    height: 310,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
  });

  splash.loadFile("splash.html");
  splash.center();
  setTimeout(function () {
    splash.close();
    win.center();
    win.show();
  }, 2000);
  win.on("close", (event) => {
    event.preventDefault();
    let options = {};
    options.type = "question";
    options.buttons = ["&Close", "&Cancel", "&Minimize"];
    options.defaultId = 1;
    options.title = "ChatGPT App";
    options.message = "do you want to close the app?";
    options.noLink = true;
    options.normalizeAccessKeys = false;

    dialog
      .showMessageBox(win, options)
      .then((choice) => {
        if (choice.response == 0) {
          win.destroy();
        } else if (choice.response == 2) {
          win.hide();
        }
      })
      .catch((err) => {
        console.log("ERROR", err);
      });
  });
  autoUpdater.on("update-available", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: "info",
      buttons: ["Ok"],
      title: "Application Update",
      message: process.platform === "win32" ? releaseNotes : releaseName,
      detail: "new version is available. Downloading now...",
    };
    dialog.showMessageBox(dialogOpts);
  });
  autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: "info",
      buttons: [ "Update ChatGPT now" , "Later"],
      title: "Application Update",
      message: process.platform === "win32" ? releaseNotes : releaseName,
      detail: "A new version has been downloaded. Restart the application to apply the updates.",
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
  function handleRedirect(e, url) {
    e.preventDefault();
    if (url !== win.webContents.getURL()) {
      shell.openExternal(url);
    }
  }
  win.webContents.on("new-window", handleRedirect);
}

app.whenReady().then(() => {
  createWindow(),
  setTimeout(function () {
    autoUpdater.checkForUpdates();
  }, 10000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
