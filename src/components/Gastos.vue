<template>
  <MainLayout>
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
              style="background-color: #77498d; color: white;"
              class="mt-4"
              type="submit"
              :loading="loading"
              block
            >
              Guardar Gasto
            </v-btn>
          </v-form>

          <!-- ALERTA -->
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

          <!-- 🔵 TABLA DE GASTOS -->
          <v-card class="mt-6">
            <v-card-title class="text-h6">Historial de Gastos</v-card-title>

            <v-data-table
              :items="historial"
              :headers="headers"
              class="mt-2"
              dense
            >
              <template #item.estado="{ item }">
                <v-chip :color="item.estado === 'online' ? 'green' : 'orange'" small>
                  {{ item.estado }}
                </v-chip>
              </template>
              <template #item.monto="{ item }">
                ${{ parseFloat(item.monto).toFixed(2) }}
              </template>
            </v-data-table>
          </v-card>

        </v-card-text>
      </v-card>
    </v-container>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import MainLayout from '@/layouts/MainLayout.vue';
import api from '@/config/axios';

/* ----------------- FORMULARIO ----------------- */
const gasto = reactive({
  fecha: new Date().toISOString().substring(0, 10),
  monto: null as number | null,
  descripcion: '',
});

const form = ref<any>(null);
const loading = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error' | 'warning'>('success');

/* ----------------- VALIDACIONES ----------------- */
const rules = {
  required: (v: any) => !!v || 'Campo requerido.',
  positiveNumber: (v: number) => (v > 0) || 'El monto debe ser positivo.',
};

/* ----------------- HISTORIAL DE GASTOS ----------------- */
const historial = ref<any[]>([]);

/* --- CORRECCIÓN: headers en formato que Vuetify espera --- */
const headers = [
  { text: "Fecha", value: "fecha" },
  { text: "Monto", value: "monto" },
  { text: "Descripción", value: "descripcion" },
  { text: "Estado", value: "estado" },
];

/* Cargar historial (online + offline) */
function actualizarHistorial() {
  const offlineRaw = JSON.parse(localStorage.getItem("gastos_offline") || "[]");
  const onlineRaw = JSON.parse(localStorage.getItem("gastos_online") || "[]");

  const offline = Array.isArray(offlineRaw)
    ? offlineRaw.map((g: any) => ({
        fecha: g.fecha,
        monto: g.monto,
        descripcion: g.descripcion,
        estado: "local",
      }))
    : [];

  const online = Array.isArray(onlineRaw)
    ? onlineRaw.map((g: any) => ({
        fecha: g.fecha,
        monto: g.monto,
        descripcion: g.descripcion,
        estado: "online",
      }))
    : [];

  // orden: primero online luego local (opcional)
  historial.value = [...online, ...offline];
}

/* Guardar exitosos online para mostrarlos en la tabla */
function guardarOnline(gastoData: any) {
  const lista = JSON.parse(localStorage.getItem("gastos_online") || "[]");
  lista.push({
    fecha: gastoData.fecha,
    monto: gastoData.monto,
    descripcion: gastoData.descripcion,
  });
  localStorage.setItem("gastos_online", JSON.stringify(lista));
  actualizarHistorial();
}

/* ----------------- MODO OFFLINE ----------------- */
function saveOffline(gastoData: any) {
  const lista = JSON.parse(localStorage.getItem('gastos_offline') || '[]');
  lista.push({ 
    fecha: gastoData.fecha, 
    monto: gastoData.monto, 
    descripcion: gastoData.descripcion,
    _local_id: Date.now() 
  });
  localStorage.setItem('gastos_offline', JSON.stringify(lista));
  actualizarHistorial();
}

/* ----------------- SINCRONIZAR ----------------- */
async function syncGastos() {
  const lista = JSON.parse(localStorage.getItem('gastos_offline') || '[]');
  if (!Array.isArray(lista) || lista.length === 0) return;

  // Hacemos una copia para iterar
  for (const g of [...lista]) {
    try {
      // enviar solo los campos necesarios
      const payload = { fecha: g.fecha, monto: g.monto, descripcion: g.descripcion };
      const res = await api.post('/gastos', payload);

      // si sube correctamente lo guardamos en "gastos_online"
      if (res && (res.status === 200 || res.status === 201)) {
        guardarOnline(payload);
        // eliminar ese item de localStorage (lo quitamos de la lista local)
        const remaining = JSON.parse(localStorage.getItem('gastos_offline') || '[]')
          .filter((x: any) => !(x._local_id === g._local_id && x.fecha === g.fecha && x.monto === g.monto));
        localStorage.setItem('gastos_offline', JSON.stringify(remaining));
      } else {
        // si el servidor responde mal, detenemos la sincronización
        return;
      }
    } catch (e) {
      // si hay error en la petición, detenemos la sincronización (reintenta cuando vuelva)
      console.warn('Error sincronizando gasto:', e);
      return;
    }
  }

  // actualizar vista final
  actualizarHistorial();
}

/* ----------------- EVENTOS ONLINE/OFFLINE ----------------- */
function handleOnline() {
  syncGastos();
}
function handleOffline() {
  // nada especial por ahora
}

onMounted(() => {
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  actualizarHistorial();
  if (navigator.onLine) syncGastos();
});

onBeforeUnmount(() => {
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
});

/* ----------------- VALIDACIÓN ----------------- */
async function safeValidateForm() {
  if (!form.value || typeof form.value.validate !== "function") return true;

  try {
    const result = await form.value.validate();
    if (typeof result === "boolean") return result;
    return result?.valid ?? true;
  } catch (e) {
    console.warn('validate() error:', e);
    return false;
  }
}

/* ----------------- ENVIAR GASTO ----------------- */
async function submitGasto() {
  const valid = await safeValidateForm();
  if (!valid) {
    message.value = "Corrige los campos del formulario.";
    messageType.value = "warning";
    return;
  }

  const gastoData = { ...gasto };
  loading.value = true;

  if (!navigator.onLine) {
    saveOffline(gastoData);
    message.value = "Sin conexión. Guardado localmente.";
    messageType.value = "warning";
    resetForm();
    loading.value = false;
    return;
  }

  try {
    const res = await api.post("/gastos", gastoData);

    if (res && (res.status === 200 || res.status === 201)) {
      guardarOnline(gastoData);
      message.value = "Gasto registrado con éxito.";
      messageType.value = "success";
      resetForm();
      // después intentar sincronizar pendientes (por si hay)
      await syncGastos();
    } else {
      throw new Error('Respuesta inesperada del servidor');
    }
  } catch (err) {
    console.warn('Error enviando al servidor:', err);
    // en caso de error, guardamos local para reintentar luego
    saveOffline(gastoData);
    message.value = "Error en servidor. Guardado localmente para reintentar.";
    messageType.value = "error";
  }

  loading.value = false;
}

/* ----------------- RESET ----------------- */
function resetForm() {
  gasto.fecha = new Date().toISOString().substring(0, 10);
  gasto.monto = null;
  gasto.descripcion = '';
  // reset validation si existe
  if (form.value) {
    if (typeof form.value.resetValidation === 'function') form.value.resetValidation();
    else if (typeof form.value.reset === 'function') form.value.reset();
  }
}
</script>

<style lang="css">
/* =============================
   PALETA DE COLORES
   Morado oscuro: #5A2C82
   Morado medio:  #77498D
   ============================= */

/* ----- Botones principales ----- */
.v-btn {
  border-radius: 8px !important;
}

/* Botón primario */
.v-btn.primary,
.v-btn[color="primary"] {
  background-color: #5A2C82 !important;
  color: white !important;
}

/* Botón de refrescar */
.v-btn[color="primary"] v-icon {
  color: white !important;
}

/* Botón editar */
.v-btn[color="warning"] {
  color: #77498D !important;
}

/* Botón ver */
.v-btn[color="info"] {
  color: #5A2C82 !important;
}

/* Botón eliminar */
.v-btn[color="error"] {
  color: #b3003b !important;
}

/* Botón de guardar cambios */
.btn-guardar,
.v-dialog .v-btn {
  background-color: #5A2C82 !important;
  color: white !important;
}

/* ----- ALERTAS ----- */
.v-alert {
  border-left: 6px solid #5A2C82 !important;
}

/* ----- CHIPS DE ESTADO ----- */
.v-chip {
  font-weight: bold !important;
}

.v-chip.green {
  background-color: #4CAF50 !important;
}
.v-chip.orange {
  background-color: #FF9800 !important;
}

/* ----- CARD GENERAL ----- */
.v-card {
  border-radius: 12px !important;
  border: 1px solid #eee !important;
}

/* ----- TÍTULOS ----- */
.v-card-title {
  color: #5A2C82 !important;
  font-weight: bold !important;
}

/* ----- TABLA ----- */
.v-data-table .v-data-table-header th {
  background-color: #F5F0F9 !important;
  color: #5A2C82 !important;
  font-weight: bold !important;
}

.v-data-table .v-data-table__wrapper tr:hover {
  background-color: #F7F1FB !important;
}

/* Divider */
.v-divider {
  border-color: #D8C7E8 !important;
}

</style>