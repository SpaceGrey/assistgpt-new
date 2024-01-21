import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useTaskStore = defineStore('taskStore', () => {
  const apps = ref([]) // 所有的app
  const app = ref(null) // 用户选择的app
  const query = ref(null) // 用户的需求

  const task = ref(null) //

  const version = ref(0)

  function selectApp(appName) {
    app.value = appName
  }

  function isSelectedApp() {
    return app.value !== null
  }

  function reset() {
    app.value = null
    query.value = null
    task.value = null
    version.value += 1
  }

  function updateUserQuery(userQuery) {
    query.value = userQuery
  }

  function updateAvailableApps(appList) {
    apps.value = appList || []
  }

  function useTask(t) {
    if (task.value === null && t.tasks && t.tasks.length > 0) {
      task.value = t
    } else {
      task.value.in_progress = t.in_progress
      task.value.current_task = t.current_task
      task.value.current_step = t.current_step
      task.value.code = t.code
    }
  }

  function prepareToStart() {
    return task.value && task.value.current_task === null
  }

  function isRunning() {
    return task.value && task.value.in_progress === true
  }

  function canContinue() {
    return task.value
      && task.value.current_task !== null
      && task.value.current_task < task.value.tasks.length - 1
      && task.value.in_progress === false
  }

  function isFinished() {
    return task.value
      && task.value.current_task !== null
      && task.value.current_task === task.value.tasks.length - 1
      && task.value.in_progress === false
  }

  function noTask() {
    return task.value === null
  }


  return {
    task,
    app,
    apps,
    query,
    selectApp,
    isSelectedApp,
    updateAvailableApps,
    updateUserQuery,
    useTask,
    reset,
    prepareToStart,
    isRunning,
    canContinue,
    isFinished,
    noTask,
    version,
  }
})