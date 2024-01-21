<template>
  <div class="tw-w-56">
    <p>{{ msg.props?.title }}</p>
    <div @click="click(app)" v-for="app in (msg?.content || [])" :class="clz" :style="style(app)">
      {{ app }}
    </div>
  </div>
</template>

<script setup>
import {computed, reactive, ref} from 'vue'
import {useTaskStore} from '@/store/taskStore.js'
import {useMsgStore} from '@/store/msgStore.js'

const { msg } = defineProps(['msg'])
const clickedApp = ref()
const taskStore = useTaskStore()
const msgStore = useMsgStore()

const baseClz = reactive(new Set([
  'tw-rounded-md',
  'tw-px-3',
  'tw-py-2',
  'tw-my-2',
  'tw-border-2',
  'tw-text-center'
]))

const disabled = computed(() => {
  return (msg?.props?.disabled || false)
})

const clz = computed(() => {
  baseClz.delete('tw-cursor-not-allowed')
  baseClz.delete('tw-cursor-pointer')

  if (msg?.props?.disabled) {
    baseClz.add('tw-cursor-not-allowed')
  } else {
    baseClz.add('tw-cursor-pointer')
  }
  return Array.from(baseClz)
})

const style = app => {
  return app === clickedApp.value
      ? 'border-color: rgb(96 165 250)'
      : ''
}

const click = app => {
  if (msg?.props?.disabled || taskStore.isSelectedApp()) {
    return
  }

  taskStore.selectApp(app)
  msgStore.push({
    type: 'server',
    card: 'text',
    content: 'input your needs'
  })

  clickedApp.value = app
  msg.props.disabled = true
}
</script>

<style scoped>

</style>