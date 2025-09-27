module.exports = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  transports: { file: { level: "info" } },
};
