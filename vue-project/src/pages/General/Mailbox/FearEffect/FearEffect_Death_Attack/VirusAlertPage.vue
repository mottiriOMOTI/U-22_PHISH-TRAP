<template>
  <div class="virus-bg d-flex flex-column align-center justify-center">
    <v-icon icon="mdi-alert-decagram" color="error" size="120" class="blink-icon mb-4"></v-icon>
    <h1 class="text-h3 font-weight-bold text-error mb-4">SYSTEM WARNING</h1>
    <h2 class="text-h5 text-white mb-6">CRITICAL VIRUS DETECTED</h2>
    
    <div class="code-box pa-4">
      <p>> status: ALL_FILES_ENCRYPTED</p>
      <p>> threat_level: SEVERE</p>
      <p>> action: DO NOT CLOSE THIS WINDOW</p>
    </div>
  </div>
</template>

<style scoped>
/* 画面全体を真っ黒にする */
.virus-bg {
  background-color: #000000 !important;
  width: 100vw;
  height: 100vh;
  font-family: 'Courier New', Courier, monospace;
}

/* 警告文っぽくコード風の枠を付ける */
.code-box {
  background-color: #1a1a1a;
  border: 1px solid #ff0000;
  color: #00ff00;
  width: 80%;
  max-width: 500px;
  text-align: left;
}

/* アイコンをチカチカ点滅させる */
.blink-icon {
  animation: blink-animation 0.8s infinite alternate;
}
@keyframes blink-animation {
  0% { opacity: 1; }
  100% { opacity: 0.2; }
}
</style>
