import {app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import axios from 'axios'
let myWindow = null;
let intervalId = null;
const getWindowCode = `
import pygetwindow as gw
from pywinauto import Desktop
import json
def get_all_windows():
    all_windows = gw.getAllWindows()
    all_windows_name = [win.title for win in all_windows if win.title]
    all_windows_name = simplify_window_names(all_windows_name)
    return all_windows_name

def simplify_window_names(names):
    simplified_names = []
    for name in names:
        # Split the name by '-' and strip whitespace
        parts = [part.strip() for part in name.split('-')]
        # Use the part after the last '-' if available, otherwise the original name
        simplified_name = parts[0] if len(parts) > 1 else name
        simplified_names.append(simplified_name)
    return simplified_names

window_names = get_all_windows()
res = json.dumps(window_names)
print(res)`
let automaticRunning = false
let myQuery = null
const pythonScriptPath = path.join(app.getAppPath(), 'src', 'get_data.py');
import { spawn }  from 'child_process'
function runCode(
  code,
  quary,
  plan,
  retry,
  software,
  inline=true
) {
  return new Promise((resolve, reject) => {
    // 执行Python代码
    let pythonProcess = null
    if (inline){
    pythonProcess = spawn('python', ['-c', code, quary, plan, retry, software])
    }
    else{
    pythonProcess = spawn('python', [code, quary, plan, retry, software])
    }
    // 用于存储Python代码的输出
    let output = ''

    // 监听Python代码的标准输出
    pythonProcess.stdout.on('data', (data) => {
      output += data
    })

    // 监听Python代码的关闭事件
    pythonProcess.on('close', (code) => {
      resolve(output)
    })
  })
}

function statusCheck() {
    axios.get('http://127.0.0.1:3001/api/monitor')
        .then(response => {
            console.log(response.data)
            reloadingUI(response.data)
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}
function startHttpRequestInterval() {
    intervalId = setInterval(statusCheck, 1000);
}

function stopHttpRequestInterval() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
function loadWindows(){
  runCode(getWindowCode,"",false,false)
    .then((res)=>{
      let result = String(res)
      //result is a json string
      let windows = JSON.parse(result)
      console.log(windows)
      myWindow.webContents.send('apps',windows)
    })
}
function reloadingUI(data){
    let mydata = data
    if (data.in_progress == null){
        mydata.in_progress = false
    }
      myWindow.webContents.send('task', {
          'in_progress': mydata.in_progress,
          'tasks':data.tasks,
          'current_task': data.current_task,
          'current_step': data.current_step,
        })
  if (data.in_progress == false){
    //add prefix "from pyautogui import *", "from time import sleep"
    if(data.code != null){
    let code = "from pyautogui import *\nfrom time import sleep\n" + data.code
    myWindow.setAlwaysOnTop(false)
    myWindow.blur()
    runCode(code,"",false,false)
    .then((result) => {
      console.log("has result")
      if(!automaticRunning)
     { 
      myWindow.focus()
      myWindow.setAlwaysOnTop(true)
    }
  })
  if (automaticRunning && data.tasks.length != data.current_task + 1){
    runCode(pythonScriptPath,myQuery.query,myQuery.is_plan,myQuery.is_retry,myQuery.software,false)
    .then(async(res)=>{
      startHttpRequestInterval()
    })
    if (data.tasks.length == data.current_task + 1){
      stopHttpRequestInterval()
    }
  }
  }
  else{
      myWindow.focus()
      myWindow.setAlwaysOnTop(true)
  }
  if (!automaticRunning){
  stopHttpRequestInterval()
  }

  }
}
const createWindow = () => {
  // Create the browser window.
   const window = new BrowserWindow({
    width: 1080,
    height: 720,
    menuBarVisible: false,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      preload: path.join(path.resolve(), '/src/electron/preload.js'),
    }
  })
  myWindow = window
  // mainWindow.setMenu(null)


  // mock
  ipcMain.on('query', (event, query) => {
    window.setAlwaysOnTop(false)
    window.blur()
    console.log(query)
    //check query.is_retry has value or not
    if(query.is_retry == undefined){
      query.is_retry = false
    }
    myQuery = query
    runCode(pythonScriptPath,query.query,query.is_plan,query.is_retry,query.software,false)
    .then(async(res)=>{
      window.focus()
      startHttpRequestInterval()
    })
  })
  ipcMain.on('automatic',(event,automatic)=>{
    console.log(automatic)
    automaticRunning = automatic
  })
  // 加载 index.html
  // todo
  window.loadURL('http://localhost:5173')

  // 打开开发工具
  window.webContents.openDevTools()
  //
  setTimeout(() => {
    loadWindows()
  }, 10000);
  
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
