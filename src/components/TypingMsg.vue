<template>
  <div>
    <p>{{ msg.props?.tips }}</p>
    <div class="tw-w-72 tw-rounded-xl tw-border-gray-300 tw-border-2 tw-mt-2 tw-mb-2">
      <div class="tw-rounded-xl tw-bg-amber-500 tw-w-0 tw-h-4 progress" :style="style"></div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
const { msg } = defineProps(['msg'])

const width = ref(0)

const style = computed(() => {
  return {
    width: width.value + '%'
  }
})

let count = 15

let timer = setInterval(() => {
  if (width.value + count >= 98) {
    width.value = 98
    clearInterval(timer)
  } else {
    width.value += count

    if (count > 4) {
      count -= 2
    }
  }
}, 250)

</script>

<style scoped>
.progress {
  transition: width ease .25s;
}
</style>