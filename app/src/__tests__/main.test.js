jest.mock("electron-updater");
jest.mock("electron-log");
jest.mock("electron", () => {
  return {
    app: {
      whenReady: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
      quit: jest.fn(),
      requestSingleInstanceLock: jest.fn(() => true),
    },
    BrowserWindow: jest.fn().mockImplementation(() => ({
      loadFile: jest.fn(),
      on: jest.fn(),
      webContents: {
        session: { webRequest: { onHeadersReceived: jest.fn() } },
        on: jest.fn(),
        send: jest.fn(),
        closeDevTools: jest.fn(),
      },
      isMinimized: jest.fn(() => false),
      isVisible: jest.fn(() => true),
      restore: jest.fn(),
      show: jest.fn(),
      focus: jest.fn(),
    })),
    ipcMain: { handle: jest.fn(), on: jest.fn() },
    Menu: { setApplicationMenu: jest.fn(), buildFromTemplate: jest.fn() },
    Tray: jest.fn(),
    nativeImage: { createFromPath: jest.fn() }
  };
});

test("создает главное окно", async () => {
  const electron = require("electron");
  const { app } = electron;

  require("../main"); 

  expect(app.whenReady).toHaveBeenCalled();
  expect(electron.BrowserWindow).toHaveBeenCalled();
});
