<template>
    <MainLayout>
  <v-container>
    <v-card class="pa-4">
      <v-card-title class="text-h5 d-flex justify-space-between align-center">
        <span>Gestión de Gastos 💰</span>
        <v-btn color="primary" @click="getGastos" :loading="loading">
          <v-icon left>mdi-refresh</v-icon>Actualizar
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="message"
          :type="messageType"
          class="mb-4"
          border="start"
          density="compact"
          closable
        >
          {{ message }}
        </v-alert>

        <v-data-table
          :headers="headers"
          :items="gastos"
          :loading="loading"
          loading-text="Cargando gastos..."
          no-data-text="No hay gastos registrados todavía."
          class="elevation-1"
        >
          <template #item.monto="{ item }">
            ${{ parseFloat(item.monto).toFixed(2) }}
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon
              color="info"
              variant="text"
              @click="verGasto(item)"
              title="Ver detalle"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>

            <v-btn
              icon
              color="warning"
              variant="text"
              @click="editarGasto(item)"
              title="Editar gasto"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              icon
              color="error"
              variant="text"
              @click="eliminarGasto(item.id)"
              title="Eliminar gasto"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <v-divider class="my-4"></v-divider>

        <div class="text-end text-h6">
          Total: ${{ totalGastos.toFixed(2) }}
        </div>
      </v-card-text>
    </v-card>

    <!-- Diálogo de Ver -->
    <v-dialog v-model="dialogVer" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">Detalle del Gasto</v-card-title>
        <v-card-text>
          <v-list dense>
            <v-list-item>
              <v-list-item-title><strong>Fecha:</strong> {{ gastoSeleccionado.fecha }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Monto:</strong> ${{ gastoSeleccionado.monto }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Descripción:</strong> {{ gastoSeleccionado.descripcion }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="dialogVer = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Editar -->
    <v-dialog v-model="dialogEditar" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">Editar Gasto ✏️</v-card-title>
        <v-card-text>
          <v-form ref="formEditar" @submit.prevent="actualizarGasto">
            <v-text-field
              v-model="gastoSeleccionado.fecha"
              label="Fecha"
              type="date"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-calendar"
              required
            ></v-text-field>

            <v-text-field
              v-model.number="gastoSeleccionado.monto"
              label="Monto"
              type="number"
              :rules="[rules.required, rules.positiveNumber]"
              prepend-inner-icon="mdi-currency-usd"
              required
            ></v-text-field>

            <v-textarea
              v-model="gastoSeleccionado.descripcion"
              label="Descripción"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-note-text"
              required
            ></v-textarea>

            <v-btn
              style="background-color: #77498d; color: white;"
              type="submit"
              class="mt-4"
              block
              :loading="loadingEditar"
            >
              Guardar Cambios
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import api from '@/config/axios'; // Instancia de Axios

import MainLayout from '@/layouts/MainLayout.vue';

const gastos = ref<any[]>([]);
const gastoSeleccionado = reactive<any>({});
const loading = ref(false);
const loadingEditar = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error' | 'info'>('info');

const dialogVer = ref(false);
const dialogEditar = ref(false);
const formEditar = ref<any>(null);

// Reglas de validación
const rules = {
  required: (v: any) => !!v || 'Campo requerido.',
  positiveNumber: (v: number) => v > 0 || 'Debe ser positivo.',
};

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Monto', key: 'monto' },
  { title: 'Descripción', key: 'descripcion' },
  { title: 'Acciones', key: 'actions', sortable: false },
];

// Obtener lista
async function getGastos() {
  loading.value = true;
  message.value = '';

  try {
    const res = await api.get('/gastos');
    gastos.value = res.data.data ?? res.data;
  } catch (e) {
    message.value = 'Error al cargar gastos.';
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
}

// Ver detalle
function verGasto(gasto: any) {
  Object.assign(gastoSeleccionado, gasto);
  dialogVer.value = true;
}

// Editar
function editarGasto(gasto: any) {
  Object.assign(gastoSeleccionado, gasto);
  dialogEditar.value = true;
}

// Actualizar gasto
async function actualizarGasto() {
  const { valid } = await formEditar.value.validate();
  if (!valid) return;

  loadingEditar.value = true;

  try {
    const res = await api.put(`/gastos/${gastoSeleccionado.id}`, gastoSeleccionado);
    message.value = 'Gasto actualizado correctamente.';
    messageType.value = 'success';
    dialogEditar.value = false;

    // Actualiza lista
    const index = gastos.value.findIndex(g => g.id === gastoSeleccionado.id);
    if (index !== -1) gastos.value[index] = res.data.data ?? res.data;
  } catch (e) {
    message.value = 'Error al actualizar el gasto.';
    messageType.value = 'error';
  } finally {
    loadingEditar.value = false;
  }
}

// Eliminar gasto
async function eliminarGasto(id: number) {
  if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;

  try {
    await api.delete(`/gastos/${id}`);
    gastos.value = gastos.value.filter(g => g.id !== id);
    message.value = 'Gasto eliminado correctamente.';
    messageType.value = 'success';
  } catch (e) {
    message.value = 'Error al eliminar el gasto.';
    messageType.value = 'error';
  }
}

const totalGastos = computed(() =>
  gastos.value.reduce((sum, g) => sum + parseFloat(g.monto), 0)
);

onMounted(() => getGastos());
</script>
