module.exports = {
  autoUpdater: {
    checkForUpdates: jest.fn(),
    downloadUpdate: jest.fn(),
    quitAndInstall: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    logger: { transports: { file: { level: "info" } } },
  },
  AppUpdater: jest.fn(),
};
