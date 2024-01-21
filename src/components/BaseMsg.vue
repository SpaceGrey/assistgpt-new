<template>
  <div class="tw-flex tw-p-2">
    <div class="tw-py-2 tw-px-3 tw-break-all tw-shadow tw-bg-zinc-50 tw-rounded-bl-xl tw-rounded-br-xl content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.server {
  justify-content: flex-start;
}

.client {
  justify-content: flex-end;
}

.server .content {
  border-top-right-radius: .75rem;
  margin-right: 2.5rem;
}

.client .content {
  border-top-left-radius: .75rem;
  margin-left: 2.5rem;
}
</style>