<template>
  <div v-html="content"></div>
</template>

<script setup>
import {computed, reactive} from 'vue'

const props = defineProps(['msg'])
const clz = reactive(['tw-flex', 'tw-p-2'])

if (props.msg?.type === 'client') {
  clz.push('tw-justify-end')
} else {
  clz.push('tw-justify-start')
}

const content = computed(() => {
  if (props.msg?.type === 'server') {
    return props.msg?.content || ''
  }

  return (props.msg?.content || '')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('\n', '<br>')
})

</script>
