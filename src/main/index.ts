// sometimes node and rxjs6 don't play well together,
// so we ensure that symbolObservable is defined from the
// very outset, so that all observables use this symbol,
// not their own definition of it.
// See https://github.com/ReactiveX/rxjs/issues/3828
import symbolObservable from 'symbol-observable'
console.log(symbolObservable);

import './setAppName'
import { app, BrowserWindow, Menu, shell, MessageBoxOptions, dialog } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS, REACT_PERF } from 'electron-devtools-installer';
import { installExtensionsAsync } from './installExtensionsAsync';
import { configureStore } from './store';
import { install as installDevtron } from 'devtron'
import { AppActions } from '../shared/actions/app';

import { divertConsoleToLogger } from './system/divertConsoleToLogger';



declare module 'electron' {
  interface BrowserWindow {
    inspectElement(x: number, y: number): void
  }
  interface Menu {
    popup(window: BrowserWindow): void
  }
}

const hasLock = app.requestSingleInstanceLock()
if (!hasLock) {
  app.on("ready", () => {
    const messageBoxOptions: MessageBoxOptions = {
      type: "warning",
      title: "Oops...",
      message: `pShare is already running`,
      detail: `You can only run one pShare at a time`,
      normalizeAccessKeys: true,
      buttons: ["&Ok"],
      noLink: true,
      cancelId: 0,
      defaultId: 0
    };
    dialog.showMessageBox(messageBoxOptions, (res, checked) => {
      app.exit()
    });
  })

} else {




  //defines paths into the store that will be persisted
  const persistencePaths = ['user.syncAgreed', 'user.userName', 'user.accountCreationTxId', 'user.accountCreated', 'rtcConfig'];
  let mainWindow: BrowserWindow | null
  let rtcWindow: BrowserWindow | null
  // let aboutPanelWindow: BrowserWindow | null

  const store = configureStore(() => mainWindow, persistencePaths)
  store.getState();

  const devToolsExtensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS, REACT_PERF];


  const isDevelopment = process.env.NODE_ENV === 'development'
  const isSpectron = process.env.IS_SPECTRON === 'true'

  isDevelopment && (!isSpectron) && app.commandLine.appendSwitch('remote-debugging-port', '9223')
  //isSpectron && app.commandLine.appendSwitch('headless')
  isSpectron && app.commandLine.appendSwitch('disable-gpu')
  // global reference to mainWindow (necessary to prevent window from being garbage collected)

  const templateUrl =
    isSpectron
      ? formatUrl({
        pathname: path.join(__dirname, '..', 'renderer', 'index.html'),
        protocol: 'file',
        slashes: true
      })
      : isDevelopment
        ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
        : formatUrl({
          pathname: path.join(__dirname, 'index.html'),
          protocol: 'file',
          slashes: true
        })

  function createRtcWindow() {
    const window = new BrowserWindow({ width: 1, height: 1, show: false })
    window.loadURL(`${templateUrl}?role=rtc`)
    return window
  }

  function createMainWindow() {
    const window = new BrowserWindow({ width: 1024, height: 768 })

  // function createAboutPanelWindow() {
  //   const window = new BrowserWindow({ width: 320, height: 240});
  // }




    console.log(`loading templateUrl : ${templateUrl}`)
    window.loadURL(`${templateUrl}?role=renderer`)



    window.on('closed', () => {
      mainWindow = null
      if (rtcWindow) {
        console.log("closing rtc window")
        rtcWindow.close()
      }
      // if (aboutPanelWindow) {
      //   console.log("closing about panel window")
      //   aboutPanelWindow.close()
      // }
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

    console.log("EVENT - window-all-closed")
    app.quit()
    //store.dispatch(process.platform !== 'darwin' ? AppActions.shuttingDown() : AppActions.sleep())
    //storeCancellationToken.cancel()
    //store.dispatch(AppActions.shuttingDown())

  })
  app.on('before-quit', e => {
    console.log("EVENT - before-quit")
    if (store.getState().app.hasShutdown) {
      console.log("store indicates hasShutdown=true, safe to quit")
      app.releaseSingleInstanceLock()
      return //now everything is cleaned up, return and allow app to quit
    }

    //1st time round
    //prevent this quit and cleanup. 
    //The when cleanup is complete this will cause a second app.quit() 
    //See function orchestrateShutdown in src/main/store/hot-reload/runRootSagaWithHotReload.ts
    console.log("not yet cleaned up, cancelling quit")
    e.preventDefault()
    store.dispatch(AppActions.shuttingDown())

  })

  app.on('quit', () => {

    console.log("EVENT - quit")

  })



  app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
      mainWindow = createMainWindow()
    }
  })

  // create main BrowserWindow when electron is ready
  app.on('ready', async () => {

    if (!isDevelopment) {
      await divertConsoleToLogger()
    }

    if (isDevelopment) {
      const installPromise = installExtensionsAsync(devToolsExtensions);
      installDevtron();
      await installPromise;
    }
    mainWindow = createMainWindow()
    rtcWindow = createRtcWindow()
    setAppMenu(mainWindow);

    if (isDevelopment) {
      // mainWindow.webContents.openDevTools({ mode: "detach" });
      // rtcWindow.webContents.openDevTools({ mode: "detach" });
      // add inspect element on right click menu
      mainWindow.webContents.on('context-menu', (e, props) => {
        mainWindow && Menu.buildFromTemplate([
          {
            label: 'Inspect element',
            click() {
              if (mainWindow) {
                mainWindow.webContents.openDevTools({ mode: "detach" });
                mainWindow.inspectElement(props.x, props.y);
              }
            }
          },
          {
            label: 'RTC devtools',
            click() {
              if (rtcWindow) {
                rtcWindow.webContents.openDevTools({ mode: "detach" });

              }
            }
          },
        ]).popup(mainWindow);
      });
    }
  })

  app.setAboutPanelOptions({
    applicationName: 'pShare',  
    applicationVersion: require('../../getVersion').version,
    version: '',
    credits: `https://duality.solutions/pShare`,

    // website: 'https://duality.solutions/pShare'
  })


  function setAppMenu(mainWindow: BrowserWindow) {
    const template = [
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' }
        ]
      },
      {
        role: 'Help',
        submenu: [
          {
            label: 'Support',
            click() { shell.openExternal('https://discord.gg/87be63e')}
          },
          {
            label: 'About pShare',
            role: 'about'
          }
        ]
      }
    ];
    if (isDevelopment) {
      template.push(<any>{
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          {
            label: 'Reset redux store',
            async click() {
              mainWindow && await mainWindow.webContents.executeJavaScript("window.resetStore && window.resetStore()")
            }
          },
          {
            label: 'Toggle RTC window devtools',
            click() {
              rtcWindow && rtcWindow.webContents.openDevTools({ mode: "detach" });
            }
          },
          { role: 'toggledevtools' },
          { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      })
    }

    if (process.platform === 'darwin') {
      template.unshift(<any>{
        label: 'pShare',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services', submenu: [] },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
      // // Edit menu
      // template[1].submenu.push(
      //   {type: 'separator'},
      //   {
      //     label: 'Speech',
      //     submenu: [
      //       {role: 'startspeaking'},
      //       {role: 'stopspeaking'}
      //     ]
      //   }
      // )
      // Window menu
      // template[3].submenu = [
        // { role: 'close' },
        // { role: 'minimize' },
        // { role: 'zoom' },
        // { type: 'separator' },
        // { role: 'front' }
      // ];
    }
    const menu = Menu.buildFromTemplate(<any>template);
    Menu.setApplicationMenu(menu);
  }

}