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
        simplified_name = parts[-1] if len(parts) > 1 else name
        simplified_names.append(simplified_name)
    return simplified_names

window_names = get_all_windows()
res = json.dumps(window_names)
print(res)`
const getDataCode = `
import json
import uiautomation as auto
from pywinauto import Application, Desktop
import os
import sys
import re
import datetime
import requests
import time
from termcolor import colored


def get_control_properties(control, properties_list):
    prop_dict = {}
    for prop in properties_list:
        # justify if prop is a method of the control.
        if not hasattr(control, prop):
            continue
        else:
            prop_dict[prop] = getattr(control, prop)()
            if prop == 'rectangle':
                rect = prop_dict[prop]
                prop_dict[prop] = [rect.left, rect.top, rect.right, rect.bottom]
        # try:
        #     prop_dict[prop] = getattr(control, prop)()
        #     if prop == 'rectangle':
        #         rect = prop_dict[prop]
        #         prop_dict[prop] = [rect.left, rect.top, rect.right, rect.bottom]
        # except Exception as e:
        #     prop_dict[prop] = str(e)
    return prop_dict


class GUICapture:
    """
    A class to capture and interact with a GUI of a specified application.
    """
    BLUE = '\\033[94m'
    GREEN = '\\033[92m'
    CYAN = '\\033[96m'
    RED = '\\033[91m'
    END = '\\033[0m'
    @staticmethod
    def get_current_time():
        return datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    def __init__(self, target_window='Adobe Premiere Pro', cache_folder='.cache/'):
        """
        Initialize the GUICapture instance.
        """
        self.task_id = self.get_current_time()
        self.target_window_name = target_window
        self.ensure_directory_exists(cache_folder)
        self.cache_folder = os.path.join(cache_folder, self.task_id)
        self.ensure_directory_exists(self.cache_folder)
        self.current_step = 0
        self.history = []

    @staticmethod
    def ensure_directory_exists(path):
        """
        Ensure that a directory exists; if not, create it.
        """
        if not os.path.exists(path):
            os.makedirs(path)

    def run(self, query, send_data=False, run_code=False, task_id=None, reset=False, software=None):
        """
        Execute the capture process.
        """
        start = time.time()
        # time.sleep(2)  # Consider explaining why this delay is necessary
        self.connect_to_application(software)
        meta_data = self.get_gui_meta_data(software)
        screenshot_path = self.capture_screenshot()
        self.current_step += 1
        self.history.append((meta_data, screenshot_path))
        print(f"Time used: {time.time() - start}")
        start = time.time()

        if send_data:
            response = self.send_data(query, task_id=task_id, reset=reset, software=software)
            if run_code:
                self.handle_response(response, start, run_code, software, task_id)
            else:
                return response
        else:
            return meta_data, screenshot_path

    def send_data(self, query, reset=False, task_id=None, software=None):
        meta_data, screenshot_path = self.history[-1]
        files = {'image': open(screenshot_path, 'rb')}

        response = requests.post(
            # 'http://10.245.84.94:4322/api/upload',
            'http://localhost:3001/api/upload',
            data={'data': json.dumps(meta_data),
                  'query': json.dumps(query),
                  'task_id': json.dumps(task_id),
                  'reset': json.dumps(reset),
                  'is_plan':json.dumps(sys.argv[3]),
                  'is_retry':json.dumps(sys.argv[4]),
                  'software': json.dumps(software)},
            files=files
        )
        if response.status_code == 200:
            print('Upload successfully!')
        return response

    def connect_to_application(self, software_name):
        """
        Connect to the target application.
        """
        try:
            self.app = Application(backend="uia").connect(title_re=f".*{software_name}*")
        except Exception as e:
            print(f"Error connecting to application: {e}")

    def handle_response(self, response, start_time, run_code, software, task_id):
        """
        Handle the response from data sending operation.
        """
        print(response)
        message = response.json().get('message', '')
        print(f"{self.BLUE}==Time used=={self.END} {time.time() - start_time}")
        print(f"{self.RED}==Message==\\n{self.END}" + message)
        if response.json()['message'] == 'Success':
            return "Success"

        if 'code' in response.json():
            code = response.json()['code']
            print(f"{self.GREEN}==Current Step==\\n{self.END}" + response.json()['current_step'])
            print(f"{self.CYAN}==Code==\\n{self.END}" + code)
        else:
            return response.json()

        if run_code:
            # Caution: Using exec. Ensure code is safe to execute.
            # TODO: Add a whitelist of allowed code.
            exec(post_process_code(code))
            self.run("None", send_data=True, run_code=True, software=software, task_id=task_id)
        else:
            return response.json()

    def get_gui_meta_data(self, software):
        # Connect to the application
        # Initialize data storage
        # control_properties_list = ['class_name', 'friendly_class_name', 'texts', 'control_id', 'rectangle', 'is_visible', 'is_enabled', 'control_count', 'is_keyboard_focusable', 'has_keyboard_focus', 'automation_id']
        control_properties_list = ['friendly_class_name', 'texts', 'rectangle', 'automation_id']
        software_th = {"Calculator": 100,
                       "计算器": 100,
                       'after_effects': 3,
                       'Edge': 100}
        th = software_th.get(software, 1)

        def recurse_controls(control, current_depth=0):
            children = control.children()
            child_data = []
            if current_depth > th:
                return []
            for child in children:
                child_data.append({
                    'properties': get_control_properties(child, control_properties_list),
                    'children': recurse_controls(child, current_depth + 1)
                })

            return child_data

        all_windows = self.app.windows()
        window_names = [window.window_text() for window in all_windows]
        meta_data = {}
        for window_name in window_names:
            if window_name:
                target_window = self.app.window(title=window_name)
                target_window.set_focus()

                # Traverse the control tree
                meta_data[window_name] = recurse_controls(target_window)
                #store meta_data into a file in self.cache folder
                with open(os.path.join(self.cache_folder, 'meta_data.json'), 'w') as f:
                    json.dump(meta_data, f, indent=4)
        return meta_data

    def capture_screenshot(self):
        # save screenshot and return path
        screenshot_path = os.path.join(self.cache_folder, f'screenshot-{self.current_step}.png')
        screenshot = auto.GetRootControl().ToBitmap()
        screenshot.ToFile(screenshot_path)
        return screenshot_path

    @staticmethod
    def get_current_time():
        return datetime.datetime.now().strftime('%Y%m%d_%H%M%S')


def post_process_code(code):
    out = ["from pyautogui import *", "from time import sleep"]
    for line in code.split("\\n"):
        if "#" not in line[:1] and line and "update_gui()" not in line:
            out.append(line + "\\nsleep(1)\\n")
    out = "\\n".join(out)
    return out


if __name__ == '__main__':
    capture = GUICapture(sys.argv[5])
    print(sys.argv)
    capture.run(sys.argv[2], send_data=True,software=sys.argv[6])

`
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
      myWindow.webContents.send('task', {
          'in_progress': data.in_progress,
          'tasks':data.tasks,
          'current_task': data.current_task,
          'current_step': data.current_step,
        })
  if (data.in_progress == false){
    //add prefix "from pyautogui import *", "from time import sleep"
    if(data.code != ""){
    let code = "from pyautogui import *\nfrom time import sleep\n" + data.code
    myWindow.setAlwaysOnTop(false)
    myWindow.blur()
    runCode(code,"",false,false)
    .then((result) => {
      console.log("has result")
      myWindow.focus()
      myWindow.setAlwaysOnTop(true)
    })
  }
  else{
      myWindow.focus()
      myWindow.setAlwaysOnTop(true)
  }
    stopHttpRequestInterval()
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
    console.log("testing")
    //check query.is_retry has value or not
    if(query.is_retry == undefined){
      query.is_retry = false
    }
    runCode(pythonScriptPath,query.query,query.is_plan,query.is_retry,query.software,false)
    .then(async(res)=>{
      window.focus()
      startHttpRequestInterval()
    })
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
