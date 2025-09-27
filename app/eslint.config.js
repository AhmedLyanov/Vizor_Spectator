import js from '@eslint/js';
import securityPlugin from 'eslint-plugin-security';

export default [
 
  js.configs.recommended,


  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        global: 'readonly',
        navigator: 'readonly',
        document: 'readonly',
        window: 'readonly',
        io: 'readonly',
        SimplePeer: 'readonly'
      }
    },
    plugins: {
      security: securityPlugin
    },
    rules: {
      
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-require': 'warn',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-unsafe-regex': 'error',

      
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error'
    }
  },

  
  {
    files: ['src/main.js', 'src/utils/**/*.js'],
    languageOptions: {
      globals: {
        app: 'readonly',
        BrowserWindow: 'readonly',
        desktopCapturer: 'readonly',
        ipcMain: 'readonly',
        Menu: 'readonly',
        Tray: 'readonly',
        nativeImage: 'readonly',
        autoUpdater: 'readonly',
        path: 'readonly',
        os: 'readonly'
      }
    },
    rules: {
      'security/detect-child-process': 'error',
      'security/detect-non-literal-fs-filename': 'error'
    }
  },

  
  {
    files: ['src/renderer.js', 'src/preload.js'],
    languageOptions: {
      globals: {
        socket: 'readonly',
        localStream: 'writable',
        peers: 'writable',
        candidateBuffers: 'writable',
        activeModalVideoId: 'writable',
        pendingClients: 'writable',
        connectionStatus: 'readonly',
        connectionCount: 'readonly',
        videoModal: 'readonly',
        modalVideo: 'readonly',
        closeModal: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly'
      }
    }
  },

 
  {
    files: ['src/preload.js'],
    languageOptions: {
      globals: {
        contextBridge: 'readonly',
        ipcRenderer: 'readonly'
      }
    }
  },


  {
    files: ['__tests__/**/*.js'],
    languageOptions: {
      globals: {
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly'
      }
    }
  }
];