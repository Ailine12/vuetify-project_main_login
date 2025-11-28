<template>
  <v-dialog v-model="isOffline" persistent max-width="400">
    <v-card color="error" dark>
      <v-card-title class="text-h6">
        <v-icon start>mdi-wifi-off</v-icon>
        Sin Conexión
      </v-card-title>

      <v-card-text>
        No tienes conexión a internet.  
        Los datos se guardarán localmente y se sincronizarán al volver la conexión.
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="isOffline = false">Entendido</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isOffline = ref(!navigator.onLine);

function updateStatus() {
  isOffline.value = !navigator.onLine;
}

onMounted(() => {
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateStatus);
  window.removeEventListener('offline', updateStatus);
});
</script>
