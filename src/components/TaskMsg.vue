<template>
  <div class="tw-min-w-72">
    <div v-for="(task, index) in (msg?.content || [])" class="tw-flex tw-items-center tw-flex-row tw-rounded-md tw-px-3 tw-py-2 tw-my-2 tw-border-2 tw-cursor-pointer" :style="style(index)">
      <span class="material-symbols-outlined !tw-text-base tw-mr-3" v-if="needRun(index)">arrow_right_alt</span>
      <span class="material-symbols-outlined !tw-text-base tw-mr-3 task-running" v-if="running(index)">refresh</span>
      <span class="material-symbols-outlined !tw-text-xs tw-mr-3" v-if="finished(index)">check</span>
      <div class="tw-grow">{{ task }}</div>
      <span class="!tw-text-xs tw-ml-3">{{ state(index) }}</span>
    </div>
  </div>
</template>

<script setup>
const { msg } = defineProps(['msg'])

const state = (index) => {

  if (finished(index)) {
    return ''
  }

  if (running(index)) {
    return msg.props?.current_step
  }

  if (nextRun(index)) {
    return 'Waiting'
  }

  return ''
}

const style = index => {
  if (nextRun(index) || running(index)) {
    return {borderColor: 'rgb(96 165 250)'}
  }

  if (finished(index)) {
    return {borderColor: '#84cc16'}
  }

  return {}
}

const nextRun = index => {
  if (msg.props?.current_task === null && index === 0) {
    return true
  }

  if (msg.props?.current_task !== null && index === msg.props?.current_task + 1 && msg.props?.in_progress === false) {
    return true
  }

  return false
}

const needRun = index => {
  if (msg.props?.current_task === null && index === 0) {
    return true
  }

  if (index > msg.props?.current_task) {
    return true
  }

  return false
}

const running = index => {
  return index === msg.props?.current_task && msg.props?.in_progress === true
}
const finished = index => {
  if (index < msg.props?.current_task) {
    return true
  }

  if (index === msg.props?.current_task && msg.props.in_progress === false) {
    return true
  }

  return false
}

</script>

<style scoped>
.task-running {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>