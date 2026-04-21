<script setup lang="ts">
import { routerState } from './router/routerState'
import TitleBar from './components/TitleBar.vue'
</script>

<template>
  <div class="app-container">
    <TitleBar />

    <div class="main-content">
      <transition name="slide-fade">
        <div v-if="routerState.isLoading" class="loading-bar">
          <div class="loading-bar-progress"></div>
        </div>
      </transition>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
/* Global styles and transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden; /* Changed from overflow-y: auto to prevent double scrolls */
  display: flex;
  flex-direction: column;
  padding-top: 48px; /* Compensation for fixed TitleBar */
}

/* Loading Bar Styles - Adjust top to be relative to main-content */
.loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background: rgba(37, 99, 235, 0.1);
  overflow: hidden;
}

.loading-bar-progress {
  height: 100%;
  background: var(--ev-blue-primary);
  box-shadow: 0 0 10px var(--ev-blue-primary);
  width: 40%;
  position: absolute;
  animation: indeterminate 1.5s infinite linear;
  transform-origin: 0% 50%;
}

@keyframes indeterminate {
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

/* Ensure full height */
#app {
  height: 100vh;
}
</style>
