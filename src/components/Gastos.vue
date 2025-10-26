<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title class="text-h5">Registrar Nuevo Gasto 💸</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitGasto" ref="form">
          
          <v-text-field
            v-model="gasto.fecha"
            label="Fecha"
            type="date"
            :rules="[rules.required]"
            required
            prepend-inner-icon="mdi-calendar"
          ></v-text-field>

          <v-text-field
            v-model.number="gasto.monto"
            label="Monto"
            type="number"
            :rules="[rules.required, rules.positiveNumber]"
            step="0.01"
            min="0"
            required
            prepend-inner-icon="mdi-currency-usd"
          ></v-text-field>

          <v-textarea
            v-model="gasto.descripcion"
            label="Descripción"
            :rules="[rules.required]"
            required
            prepend-inner-icon="mdi-note-text"
          ></v-textarea>

          <v-btn
            color="primary"
            class="mt-4"
            type="submit"
            :loading="loading"
            block
          >
            Guardar Gasto
          </v-btn>
        </v-form>

        <v-alert
          v-if="message"
          :type="messageType"
          class="mt-4"
          density="compact"
          border="start"
          closable
        >
          {{ message }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
// Importa tu instancia de Axios configurada con el interceptor
import api from '@/config/axios'; // Ajusta la ruta si es necesario

// Estado del formulario
const gasto = reactive({
  fecha: new Date().toISOString().substring(0, 10), // Fecha actual por defecto
  monto: null as number | null,
  descripcion: '',
});

// Referencias y estado
const form = ref<any>(null); // Ref para el formulario de Vuetify
const loading = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error' | 'warning'>('success');

// Reglas de validación
const rules = {
  required: (value: any) => !!value || 'Campo requerido.',
  positiveNumber: (value: number) => (value > 0) || 'El monto debe ser un número positivo.',
};

/**
 * Envía la solicitud POST a la API de Laravel
 */
async function submitGasto() {
  // 1. Validar el formulario de Vuetify
  const { valid } = await form.value.validate();
  if (!valid) {
    message.value = 'Por favor, completa correctamente todos los campos.';
    messageType.value = 'warning';
    return;
  }

  loading.value = true;
  message.value = ''; // Limpiar mensaje previo

  try {
    // 2. Llamada a la API usando la instancia configurada (con token)
    const response = await api.post('/gastos', gasto);
    
    // Éxito: código 201 (Created)
    if (response.status === 201) {
      message.value = '¡Gasto registrado con éxito! ID: ' + response.data.data.id;
      messageType.value = 'success';
      
      // 3. Resetear el formulario para un nuevo gasto
      resetForm();
    }
  } catch (error: any) {
    console.error('Error al registrar el gasto:', error);
    
    // Manejo de errores de validación de Laravel (código 422)
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors;
      // Concatenar todos los errores de validación
      message.value = 'Error de validación: ' + Object.values(errors).flat().join(', ');
      messageType.value = 'error';
    } else {
      message.value = 'Ocurrió un error al intentar registrar el gasto.';
      messageType.value = 'error';
    }
  } finally {
    loading.value = false;
  }
}

/**
 * Función para resetear los valores del formulario
 */
function resetForm() {
  gasto.fecha = new Date().toISOString().substring(0, 10);
  gasto.monto = null;
  gasto.descripcion = '';
  // Resetea la validación visual
  form.value.resetValidation(); 
}
</script>