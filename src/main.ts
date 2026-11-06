// Copyright (c) 2026 Miloš Milinkov. All rights reserved.
// Proprietary: no use, copying, modification or deployment without written permission. See LICENSE.

import '@fontsource-variable/inter'
import './styles/main.css'
import './styles/additions.css'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

// Enables the entrance-animation styles (`.js .reveal:not(.in)` etc.).
document.documentElement.classList.add('js')

const app = createApp(App)
app.use(router)
void router.isReady().then(() => app.mount('#app'))
