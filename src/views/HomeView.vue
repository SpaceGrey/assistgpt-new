<template>
  <main class="tw-pb-20">
    <div class="tw-fixed tw-top-0 tw-left-0 tw-right-0 tw-p-2 tw-flex tw-justify-center">
      <span class="tw-cursor-pointer tw-rounded-3xl tw-bg-green-600 tw-text-white tw-px-6 tw-py-2" @click="reset">
        Reset
      </span>
    </div>

    <div id="msg-list" style="max-height: calc(100vh - 5rem)" class="tw-overflow-y-auto tw-pt-14" ref="msgWrapper">
      <Msg v-for="msg in msgStore.list" :msg="msg">
      </Msg>
    </div>

    <div class="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-pb-3 tw-pl-2 tw-pr-2">
      <form class="tw-relative tw-flex" v-if="taskStore.noTask()" @submit.prevent="submit">
        <input
            v-model="content"
            @input="input"
            placeholder="Type your needs"
            autofocus
            type="text"
            autocomplete="off"
            class="tw-overflow-hidden tw-resize-none tw-w-full tw-outline-0 tw-border-none tw-rounded-3xl tw-min-h-12 tw-max-h-108px tw-leading-9 tw-py-1.5 tw-pl-2.5 tw-pr-20">

        <div class="tw-absolute tw-bottom-1.5 tw-right-1.5 tw-flex tw-shadow-2xl">
          <span v-show="content.length > 0" @click="clear" class="material-symbols-outlined tw-cursor-pointer tw-bg-transparent tw-text-indigo-950 tw-w-9 tw-h-9 tw-flex tw-text-center">clear</span>
          <span :style="submitStyle" @click="submit" class="material-symbols-outlined tw-cursor-pointer tw-bg-indigo-400 tw-text-white tw-w-9 tw-h-9 tw-flex tw-text-center tw-rounded-1/2">arrow_forward</span>
        </div>
      </form>

      <div class="tw-relative tw-flex" v-if="taskStore.prepareToStart()">
        <button @click="startTask" class="tw-bg-amber-500 tw-text-slate-50 tw-text-center tw-w-full tw-outline-0 tw-border-none tw-rounded-3xl tw-min-h-12 tw-max-h-108px tw-leading-9 tw-py-1.5 tw-pl-2.5">Start</button>
      </div>

      <div class="tw-relative tw-flex" v-if="taskStore.isRunning()">
        <button class="tw-bg-amber-500 tw-cursor-not-allowed tw-text-slate-50 tw-text-center tw-w-full tw-outline-0 tw-border-none tw-rounded-3xl tw-min-h-12 tw-max-h-108px tw-leading-9 tw-py-1.5 tw-pl-2.5">Running</button>
      </div>

      <div class="tw-relative tw-flex" v-if="taskStore.canContinue()">
        <button @click="continueTask" class="tw-basis-7/12 tw-bg-amber-500 tw-text-slate-50 tw-text-center tw-outline-0 tw-border-none tw-rounded-3xl tw-min-h-12 tw-max-h-108px tw-leading-9 tw-py-1.5 tw-pl-2.5 tw-mr-1">Continue</button>
        <button @click="retryTask" class="tw-basis-5/12 tw-bg-sky-500 tw-text-slate-50 tw-text-center tw-outline-0 tw-border-none tw-rounded-3xl tw-min-h-12 tw-max-h-108px tw-leading-9 tw-py-1.5 tw-pl-2.5 tw-ml-1">Retry</button>
      </div>

      <div class="tw-relative tw-flex" v-if="taskStore.isFinished()">
        <button @click="finishTask" class="tw-basis-7/12 tw-bg-amber-500 tw-text-slate-50 tw-text-center tw-outline-0 tw-border-none tw-rounded-3xl tw-min-h-12 tw-max-h-108px tw-leading-9 tw-py-1.5 tw-pl-2.5 tw-mr-1">Finish</button>
        <button @click="retryTask" class="tw-basis-5/12 tw-bg-sky-500 tw-text-slate-50 tw-text-center tw-outline-0 tw-border-none tw-rounded-3xl tw-min-h-12 tw-max-h-108px tw-leading-9 tw-py-1.5 tw-pl-2.5 tw-ml-1">Retry</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import {reactive, ref, unref, nextTick, onMounted} from 'vue'
import Msg from '@/components/Msg.vue'
import {useTaskStore} from '@/store/taskStore.js'
import {useMsgStore} from '@/store/msgStore.js'

const msgWrapper = ref(null)

const content = ref('')
const submitStyle = reactive({
  opacity: 0.5
})

const taskStore = useTaskStore()
const msgStore = useMsgStore()

const input = e => {
  e.target.style.height = 0
  e.target.style.height = e.target.scrollHeight + 'px'

  if (content.value.length > 0) {
    submitStyle.opacity = 1
  } else {
    submitStyle.opacity = 0.5
  }
}

const clear = () => {
  content.value = ''
  submitStyle.opacity = 0.5
}

const submit = () => {
  const msg = unref(content)
  if (msg.length < 1) {
    return
  }

  msgStore.push({
    type: 'client',
    content: msg,
    card: 'text'
  })

  if (!taskStore.isSelectedApp()) {
    msgStore.disableAllAppMsg()
    msgStore.push({
      type: 'server',
      card: 'app',
      content: taskStore.apps,
      props: {
        title: 'Please select app:',
        disabled: false,
      }
    })
  } else {
    msgStore.push({
      type: 'server',
      card: 'typing',
      props: {
        show: true,
        tips: 'Generating process 🚀...',
      }
    })

    taskStore.updateUserQuery(msg)
    window.electronAPI.sendQuery({
      query: msg,
      is_plan: true,
      software: taskStore.app,
    })
  }
  clear()
}

const startTask = () => {
  continueTask()
}

const continueTask = () => {
  window.electronAPI.sendQuery({
    query: taskStore.query,
    is_retry: false,
    software: taskStore.app,
  })
}

const retryTask = () => {
  msgStore.backStepTask()
  window.electronAPI.sendQuery({
    query: taskStore.query,
    is_retry: true,
    software: taskStore.app,
  })
}

const reset = () => {
  msgStore.reset()
  taskStore.reset()
}

const finishTask = () => {
  taskStore.reset()
}

const jumpToEnd = () => {
  msgWrapper.value?.scrollTo({
    top: msgWrapper.value.scrollHeight,
    behavior: 'smooth'
  })
}

const registerEvents = () => {
  window.electronAPI.onAvailableApps(apps => {
    taskStore.updateAvailableApps(apps)

    msgStore.push({
      type: 'server',
      card: 'app',
      content: apps,
      props: {
        title: 'Please select app:',
        disabled: false,
      }
    })
  })

  window.electronAPI.onTaskEvent(task => {
    msgStore.removeAllServerTyping()

    nextTick(() => {
      console.log(task)
      taskStore.useTask(task)
      msgStore.updateLastTaskMsg(task, taskStore.version)
    })
  })
}

registerEvents()
// ipcRenderer.on('apps', (event, apps) => {
//   console.log(apps)
//   msgStore.push({
//       type: 'server',
//       card: 'app',
//       content: apps,
//       props: {
//         title: 'Please select app:',
//         disabled: false,
//       }
//     })
// })

onMounted(() => {
  msgStore.$subscribe((mutation, state) => {
    nextTick(jumpToEnd)
  })
})
</script>

<style>
  #msg-list::-webkit-scrollbar {
    display: none;
  }

  main {
    min-height: 100vh;
    background-image: linear-gradient(0deg,rgba(102, 89, 247, 0.81) 0%,rgba(47, 208, 242, 1) 100%);
    background-repeat: repeat;
    z-index: -1;
  }
</style>