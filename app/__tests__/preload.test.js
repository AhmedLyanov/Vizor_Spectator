jest.mock("electron", () => ({
  contextBridge: { exposeInMainWorld: jest.fn() },
  ipcRenderer: { invoke: jest.fn(), on: jest.fn(), send: jest.fn() },
}));

test("exposeInMainWorld called", () => {
  const { contextBridge } = require("electron");
  require("../src/preload");
  expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
    "electronAPI",
    expect.any(Object)
  );
});
