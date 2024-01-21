import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useTypingStore = defineStore('typingStore', () => {
  const typing = ref(0)

  function update() {
    typing.value = new Date().getTime()
  }

  return {
    update, typing
  }
})