<template>
  <BaseMsg :class="msg.type" v-show="msg?.props?.show !== false">
    <TextMsg :msg="msg" v-if="msg?.card === 'text'"/>
    <AppMsg :msg="msg" v-if="msg?.card === 'app'" />
    <TypingMsg :msg="msg" v-if="msg?.card === 'typing'" />
    <TaskMsg  :msg="msg" v-if="msg?.card === 'task'" />
  </BaseMsg>
</template>

<script setup>
import TextMsg from '@/components/TextMsg.vue'
import BaseMsg from '@/components/BaseMsg.vue'
import AppMsg from '@/components/AppMsg.vue'
import TypingMsg from '@/components/TypingMsg.vue'
import TaskMsg from '@/components/TaskMsg.vue'

const {msg} = defineProps(['msg'])
</script>

<style>
</style>