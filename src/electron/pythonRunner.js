const { spawn } = require('child_process')
function runCode(
  code,
  quary,
  plan,
  retry,
  software
) {
  return new Promise((resolve, reject) => {
    // 执行Python代码
    const pythonProcess = spawn('python', ['-c', code, quary, plan, retry, software])
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
export { runCode }
