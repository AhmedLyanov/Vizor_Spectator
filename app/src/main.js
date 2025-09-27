const {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
} = require("electron");
const { autoUpdater, AppUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");
const os = require("os");

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
let mainWindow = null;
let tray = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
        //Для разрабюотки true, продакшен - false
        devTools: false,
      },
      icon: path.join(__dirname, "./assets/logo/logo.ico"),
      show: false,
      frame: false,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "rgba(10, 14, 23, 0.8)",
        symbolColor: "#E8EAED",
        height: 35,
      },
    });

    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://104.249.40.252:3001 http://104.249.40.252:3001; img-src 'self' data:",
            ],
          },
        });
      }
    );

    // блокировка DevTools для продакшен
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });

    //  горячие клавиши DevTools
    // mainWindow.webContents.on("before-input-event", (event, input) => {
    //   if (input.key === "F12" || (input.control && input.key === "i")) {
    //     mainWindow.webContents.toggleDevTools();
    //   }
    // });

    Menu.setApplicationMenu(null);
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    mainWindow.on("close", (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
      return false;
    });

    mainWindow.on("minimize", (event) => {
      event.preventDefault();
      mainWindow.hide();
    });
  }

  function createTray() {
    const iconPath = path.join(__dirname, "./assets/logo/logo.ico");
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Показать приложение",
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: "Выход",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setToolTip("HELLO");
    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => {
      mainWindow.maximize();
      mainWindow.show();
    });
  }

  app.whenReady().then(() => {
    createWindow();
    createTray();
    autoUpdater.checkForUpdates();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        createTray();
      } else {
        mainWindow.show();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
    }
  });

  ipcMain.handle("GET_SOURCES", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 150, height: 150 },
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }));
  });

  // // Принудительная проверка обновлений в режиме разработки
  // app.whenReady().then(() => {
  //   createWindow();
  //   createTray();

  //   // ПРИНУДИТЕЛЬНО ВКЛЮЧАЕМ ПРОВЕРКУ В РАЗРАБОТКЕ
  //   if (!app.isPackaged) {
  //     // Вариант 1: Обманываем систему
  //     process.env.NODE_ENV = 'production';

  //     // Вариант 2: Явно форсируем конфиг
  //     autoUpdater.forceDevUpdateConfig = true;

  //     // Вариант 3: Вручную настраиваем GitHub
  //     autoUpdater.setFeedURL({
  //       provider: 'github',
  //       owner: 'AhmedLyanov',
  //       repo: 'HELLO_Spectator',
  //       channel: 'latest'
  //     });
  //   }

  //   // Запускаем проверку
  //   setTimeout(() => {
  //     autoUpdater.checkForUpdates();
  //   }, 2000);
  // });

  autoUpdater.on("update-available", () => {
    mainWindow.webContents.send(
      "update-message",
      "Доступно новое обновление! 🚀"
    );
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update-message", "Обновлений нет ✅");
  });

  autoUpdater.on("error", (err) => {
    mainWindow.webContents.send("update-message", "Ошибка обновления: " + err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    let log_message = `Скачивание: ${Math.round(progressObj.percent)}%`;
    mainWindow.webContents.send("update-message", log_message);
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send(
      "update-message",
      "Обновление загружено. Перезапуск..."
    );
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle("GET_USERNAME", async () => {
    return os.userInfo().username;
  });

  ipcMain.handle("GET_HOSTNAME", async () => {
    return os.hostname();
  });

  ipcMain.on("download-update", () => {
    autoUpdater.downloadUpdate();
  });
  ipcMain.on("window-minimize", () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on("window-maximize", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on("window-close", () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.on("window-is-maximized", (event) => {
    event.returnValue = mainWindow ? mainWindow.isMaximized() : false;
  });
}
