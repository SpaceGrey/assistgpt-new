import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useMsgStore = defineStore('msgStore', () => {
  const list = ref([])
  let lastVersion = -1

  function push(msg) {
    list.value.push(msg)
  }

  function reset() {
    list.value.length = 0
    lastVersion = -1
  }

  function removeAllServerTyping() {
    list.value.filter(msg => msg?.card === 'typing')
      .forEach(m => {
        m.props = m.props || {}
        m.props.show = false
      })
  }

  function updateLastTaskMsg(task, taskVersion) {
    const find = findLastTaskMsg()
    console.log(task)
    if (lastVersion !== taskVersion || find < 0) {
      push({
        type: 'server',
        card: 'task',
        content: task.tasks,
        props: {
          current_task: task.current_task,
          current_step: task.current_step,
          in_progress: task.in_progress
        }
      })
      lastVersion = taskVersion
    } else {
      list.value[find].props.current_task = task.current_task
      list.value[find].props.current_step = task.current_step
      list.value[find].props.in_progress = task.in_progress
    }
  }

  function backStepTask() {
    const find = findLastTaskMsg()
    if (find < 0) {
      return
    }

    list.value[find].props.current_task--
  }

  function findLastTaskMsg() {
    let find = -1
    for (let i = list.value.length - 1; i >= 0; i--) {
      if (list.value[i].card === 'task') {
        find = i
        break
      }
    }
    return find
  }

  function disableAllAppMsg() {
    list.value.filter(m => m?.type === 'server' && m?.card === 'app')
      .forEach(m => {
        m.props = m.props || {}
        m.props.disabled = true
      })
  }

  return {
    list,
    push,
    reset,
    removeAllServerTyping,
    updateLastTaskMsg,
    disableAllAppMsg,
    backStepTask,
  }
})