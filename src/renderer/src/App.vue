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
/* Reset global equilibrado */
html,
body,
#app {
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.app-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

/* Global styles and transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.main-content {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Permite scroll nas páginas que precisarem */
}

/* Scrollbar styling - EXCLUSIVO para o conteúdo principal */
.main-content::-webkit-scrollbar {
  display: block; /* Garante que apareça aqui */
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #020617;
}

.main-content::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #334155;
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
</style>
