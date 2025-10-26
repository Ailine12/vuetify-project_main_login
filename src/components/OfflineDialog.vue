<template>
  <v-dialog v-model="isOffline" persistent max-width="400">
    <v-card color="error" dark>
      <v-card-title class="text-h6">
        <v-icon start>mdi-wifi-off</v-icon>
        Sin Conexión
      </v-card-title>
      <v-card-text>
        Estás trabajando sin conexión a internet. Los datos que ingreses se guardarán localmente y se sincronizarán cuando recuperes la conexión.
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
    // CORREGIDO: isOffline.value es lo opuesto a navigator.onLine
    isOffline.value = !navigator.onLine;

    if (!isOffline.value) {
        console.log('¡Conexión recuperada! Iniciando sincronización de datos...');
        // Aquí iría tu función synchronizeGastos();
    }
}

// 2. Registrar los Event Listeners al montar el componente (CORREGIDO: Fuera de cualquier otra función)
onMounted(() => {
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
});

onBeforeUnmount(() => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
});
</script>