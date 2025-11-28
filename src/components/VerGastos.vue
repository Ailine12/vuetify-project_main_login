<template>
  <MainLayout>
    <v-container>
      <v-card class="pa-4">
        <v-card-title class="text-h5 d-flex justify-space-between align-center">
          <span>Gestión de Gastos 💰</span>
          <v-btn color="primary" @click="getGastos" :loading="loading">
            <v-icon left>mdi-refresh</v-icon>
            Actualizar
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
            :items="gastosCombined"
            :loading="loading"
            loading-text="Cargando gastos..."
            no-data-text="No hay gastos registrados todavía."
            class="elevation-1"
          >
            <template #item.monto="{ item }">
              ${{ Number(item.monto || 0).toFixed(2) }}
            </template>

            <template #item.estado="{ item }">
              <v-chip :color="item.estado === 'online' ? 'green' : 'orange'" text-color="white" small>
                {{ item.estado }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn icon color="info" variant="text" @click="verGasto(item)" title="Ver">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn icon color="warning" variant="text" @click="editarGasto(item)" title="Editar">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon color="error" variant="text" @click="eliminarGasto(item)" title="Eliminar">
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

      <!-- Dialog VER -->
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
              <v-list-item>
                <v-list-item-title><strong>Estado:</strong> {{ gastoSeleccionado.estado || 'online' }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" block @click="dialogVer = false">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog EDITAR -->
      <v-dialog v-model="dialogEditar" max-width="500px">
        <v-card>
          <v-card-title class="text-h6">Editar Gasto ✏️</v-card-title>
          <v-card-text>
            <v-form ref="formEditar" @submit.prevent="actualizarGasto">
              <v-text-field
                v-model="gastoSeleccionado.fecha"
                label="Fecha"
                type="date"
                prepend-inner-icon="mdi-calendar"
                :rules="[rules.required]"
              ></v-text-field>

              <v-text-field
                v-model.number="gastoSeleccionado.monto"
                label="Monto"
                type="number"
                prepend-inner-icon="mdi-currency-usd"
                :rules="[rules.required, rules.positiveNumber]"
              ></v-text-field>

              <v-textarea
                v-model="gastoSeleccionado.descripcion"
                label="Descripción"
                prepend-inner-icon="mdi-note-text"
                :rules="[rules.required]"
              ></v-textarea>

              <v-btn
                style="background-color: #77498d; color: white;"
                class="mt-4"
                type="submit"
                :loading="loadingEditar"
                block
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
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import api from "@/config/axios";
import MainLayout from "@/layouts/MainLayout.vue";

/* ---------- keys ---------- */
const LS_KEY_PENDING = "gastos_offline";

/* ---------- state ---------- */
const gastos = ref<any[]>([]); // list online
const gastosPendientes = ref<any[]>([]); // offline items (pending)
const gastoSeleccionado = reactive<any>({});
const dialogVer = ref(false);
const dialogEditar = ref(false);
const formEditar = ref<any>(null);

const loading = ref(false);
const loadingEditar = ref(false);
const message = ref("");
const messageType = ref<"info" | "success" | "error" | "warning">("info");

/* ---------- rules ---------- */
const rules = {
  required: (v: any) => !!v || "Campo requerido.",
  positiveNumber: (v: any) => (Number(v) > 0) || "Debe ser positivo.",
};

/* ---------- headers Vuetify ---------- */
const headers = [
  { text: "ID", value: "id" },
  { text: "Fecha", value: "fecha" },
  { text: "Monto", value: "monto" },
  { text: "Descripción", value: "descripcion" },
  { text: "Estado", value: "estado" },
  { text: "Acciones", value: "actions", sortable: false },
];

/* ---------- storage helpers ---------- */
function loadPendientesFromStorage() {
  const raw = localStorage.getItem(LS_KEY_PENDING);
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    gastosPendientes.value = Array.isArray(parsed) ? parsed : [];
  } catch {
    gastosPendientes.value = [];
  }
}

function savePendientesToStorage() {
  localStorage.setItem(LS_KEY_PENDING, JSON.stringify(gastosPendientes.value));
}

/* Helper: add or replace an online item (avoid duplicates) */
function addOrReplaceOnline(item: any) {
  if (!item || !item.id) return;
  const idx = gastos.value.findIndex((g) => g.id === item.id);
  if (idx === -1) {
    gastos.value.unshift(item);
  } else {
    gastos.value[idx] = item;
  }
}

/* ---------- computed combined ---------- */
const gastosCombined = computed(() => {
  const online = gastos.value.map((g: any) => ({ ...g, estado: "online" }));
  const local = gastosPendientes.value.map((g: any) => ({ ...g, estado: "local" }));
  // Mostrar online primero (puedes cambiar)
  return [...online, ...local];
});

/* ---------- totals ---------- */
const totalGastos = computed(() =>
  gastosCombined.value.reduce((acc, g) => acc + Number(g.monto || 0), 0)
);

/* ---------- manage pending items ---------- */
function pushPendingCreate(payload: any) {
  // avoid exact duplicates: check identical fields not already in pending (simple check)
  const exists = gastosPendientes.value.some(p =>
    p._action === "create" &&
    p.fecha === payload.fecha &&
    Number(p.monto) === Number(payload.monto) &&
    String(p.descripcion) === String(payload.descripcion)
  );
  if (exists) return;
  gastosPendientes.value.push({
    _local_id: Date.now() + Math.floor(Math.random() * 1000),
    _action: "create",
    ...payload,
  });
  savePendientesToStorage();
}

function pushPendingUpdate(remoteId: number | null, payload: any) {
  // if remoteId present, try to update existing pending update for that remoteId
  if (remoteId) {
    const idx = gastosPendientes.value.findIndex(p => p._action === "update" && p.remoteId === remoteId);
    if (idx !== -1) {
      gastosPendientes.value[idx] = { ...gastosPendientes.value[idx], ...payload };
      savePendientesToStorage();
      return;
    }
  }
  // If not found, append an update pending
  gastosPendientes.value.push({
    _local_id: Date.now() + Math.floor(Math.random() * 1000),
    _action: "update",
    remoteId: remoteId ?? null,
    ...payload,
  });
  savePendientesToStorage();
}

function pushPendingDelete(remoteId: number | null, item: any) {
  // If there's a pending create for the same content, remove it instead of adding delete
  if (remoteId == null) {
    // try remove pending create that matches fields
    const idxCreate = gastosPendientes.value.findIndex(p =>
      p._action === "create" &&
      p.fecha === item.fecha &&
      Number(p.monto) === Number(item.monto) &&
      String(p.descripcion) === String(item.descripcion)
    );
    if (idxCreate !== -1) {
      gastosPendientes.value.splice(idxCreate, 1);
      savePendientesToStorage();
      return;
    }
  }
  // Otherwise add delete tombstone if not already present
  const exists = gastosPendientes.value.some(p => p._action === "delete" && p.remoteId === remoteId);
  if (!exists) {
    gastosPendientes.value.push({
      _local_id: Date.now() + Math.floor(Math.random() * 1000),
      _action: "delete",
      remoteId: remoteId ?? null,
      fecha: item.fecha,
      monto: item.monto,
      descripcion: item.descripcion,
    });
    savePendientesToStorage();
  }
}

/* ---------- sync logic: deletes -> updates -> creates ---------- */
async function syncPendientes() {
  if (!navigator.onLine) return;
  loadPendientesFromStorage();
  if (!gastosPendientes.value.length) return;

  // 1) Process deletes first
  const deletes = gastosPendientes.value.filter(p => p._action === "delete");
  for (const d of [...deletes]) {
    try {
      if (d.remoteId) {
        await api.delete(`/gastos/${d.remoteId}`);
      }
      // remove tombstone (whether remoteId existed or not)
      gastosPendientes.value = gastosPendientes.value.filter(p => p._local_id !== d._local_id);
      savePendientesToStorage();
    } catch (err) {
      console.warn("Error procesando delete pendiente:", err);
      // leave for later
    }
  }

  // 2) Process updates
  const updates = gastosPendientes.value.filter(p => p._action === "update");
  for (const u of [...updates]) {
    try {
      // if remoteId exists, call PUT; otherwise it's an update for an item not present remotely -> treat as create
      if (u.remoteId) {
        const res = await api.put(`/gastos/${u.remoteId}`, {
          fecha: u.fecha,
          monto: u.monto,
          descripcion: u.descripcion,
        });
        const updated = res.data?.data ?? { id: u.remoteId, fecha: u.fecha, monto: u.monto, descripcion: u.descripcion };
        addOrReplaceOnline(updated);
        // remove this pending update
        gastosPendientes.value = gastosPendientes.value.filter(p => p._local_id !== u._local_id);
        savePendientesToStorage();
      } else {
        // no remoteId -> treat as create
        const res = await api.post('/gastos', { fecha: u.fecha, monto: u.monto, descripcion: u.descripcion });
        const created = res.data?.data ?? null;
        if (created && created.id) addOrReplaceOnline(created);
        // remove pending
        gastosPendientes.value = gastosPendientes.value.filter(p => p._local_id !== u._local_id);
        savePendientesToStorage();
      }
    } catch (err) {
      console.warn("Error procesando update pendiente:", err);
      // stop processing further to avoid ordering issues; will retry later
    }
  }

  // 3) Process creates
  const creates = gastosPendientes.value.filter(p => p._action === "create");
  for (const c of [...creates]) {
    try {
      const res = await api.post('/gastos', { fecha: c.fecha, monto: c.monto, descripcion: c.descripcion });
      const created = res.data?.data ?? null;
      if (created && created.id) addOrReplaceOnline(created);
      // remove pending create
      gastosPendientes.value = gastosPendientes.value.filter(p => p._local_id !== c._local_id);
      savePendientesToStorage();
    } catch (err) {
      console.warn("Error procesando create pendiente:", err);
      // stop processing further creates
      return;
    }
  }
}

/* ---------- load online list ---------- */
async function getGastos() {
  loading.value = true;
  message.value = "";
  try {
    const res = await api.get("/gastos");
    const arr = res.data?.data ?? res.data ?? [];
    // normalize and set, avoid duplicates
    gastos.value = Array.isArray(arr) ? arr : [];
    // ensure no duplicates with items we already have from previous syncs
  } catch (err) {
    message.value = "No se pudo cargar desde el servidor (modo offline).";
    messageType.value = "warning";
  } finally {
    loading.value = false;
    loadPendientesFromStorage();
  }
}

/* ---------- view / edit ---------- */
function verGasto(item: any) {
  // copy to selected (clone)
  Object.assign(gastoSeleccionado, JSON.parse(JSON.stringify(item)));
  dialogVer.value = true;
}

function editarGasto(item: any) {
  Object.assign(gastoSeleccionado, JSON.parse(JSON.stringify(item)));
  dialogEditar.value = true;
}

/* safe validate for formEditar */
async function safeValidateFormEditar(): Promise<boolean> {
  if (!formEditar.value || typeof formEditar.value.validate !== "function") return true;
  try {
    const r = await formEditar.value.validate();
    if (typeof r === "boolean") return r;
    return r?.valid ?? true;
  } catch {
    return false;
  }
}

/* ---------- update ---------- */
async function actualizarGasto() {
  const valid = await safeValidateFormEditar();
  if (!valid) return;

  loadingEditar.value = true;

  const { fecha, monto, descripcion, estado, id, _local_id } = gastoSeleccionado;

  // LOCAL update: find by _local_id and overwrite (no duplicate)
  if (estado === "local" || !id) {
    const idx = gastosPendientes.value.findIndex(p => p._local_id === _local_id);
    if (idx !== -1) {
      gastosPendientes.value[idx] = { ...gastosPendientes.value[idx], fecha, monto, descripcion };
      savePendientesToStorage();
      message.value = "Gasto local actualizado.";
      messageType.value = "success";
    } else {
      // If no matching pending, create an update pending (remoteId unknown)
      pushPendingUpdate(null, { fecha, monto, descripcion });
      message.value = "Cambio guardado localmente (pendiente).";
      messageType.value = "warning";
    }
    dialogEditar.value = false;
    loadingEditar.value = false;
    return;
  }

  // ONLINE update: try to update API; if fails, save pending update (remoteId = id)
  try {
    const res = await api.put(`/gastos/${id}`, { fecha, monto, descripcion });
    const updated = res.data?.data ?? { id, fecha, monto, descripcion };
    // replace in gastos array
    const idx = gastos.value.findIndex(g => g.id === updated.id);
    if (idx !== -1) gastos.value[idx] = updated;
    else addOrReplaceOnline(updated);
    message.value = "Gasto actualizado correctamente.";
    messageType.value = "success";
  } catch (err) {
    console.warn("Error actualizando online, guardando update pendiente:", err);
    pushPendingUpdate(id, { fecha, monto, descripcion });
    message.value = "No se pudo actualizar en servidor. Cambio guardado localmente.";
    messageType.value = "warning";
  } finally {
    dialogEditar.value = false;
    loadingEditar.value = false;
  }
}

/* ---------- delete ---------- */
async function eliminarGasto(item: any) {
  if (!confirm("¿Seguro que deseas eliminar este gasto?")) return;

  // LOCAL delete: if pending create, remove directly; else add delete tombstone
  if (item.estado === "local" || !item.id) {
    // if it's a create pending with matching fields, remove it
    const idxCreate = gastosPendientes.value.findIndex(p =>
      p._action === "create" &&
      p.fecha === item.fecha &&
      Number(p.monto) === Number(item.monto) &&
      String(p.descripcion) === String(item.descripcion)
    );
    if (idxCreate !== -1) {
      gastosPendientes.value.splice(idxCreate, 1);
      savePendientesToStorage();
      message.value = "Gasto pendiente eliminado localmente.";
      messageType.value = "success";
      return;
    }
    // otherwise remove by _local_id if present
    if (item._local_id) {
      gastosPendientes.value = gastosPendientes.value.filter(p => p._local_id !== item._local_id);
      savePendientesToStorage();
      message.value = "Gasto local eliminado.";
      messageType.value = "success";
      return;
    }
    message.value = "No se encontró identificador local para eliminar.";
    messageType.value = "error";
    return;
  }

  // ONLINE delete: try to call API; if fails, register a tombstone
  try {
    await api.delete(`/gastos/${item.id}`);
    gastos.value = gastos.value.filter(g => g.id !== item.id);
    message.value = "Gasto eliminado correctamente.";
    messageType.value = "success";
  } catch (err) {
    console.warn("Error eliminando online, registrando delete pendiente:", err);
    pushPendingDelete(item.id, item);
    message.value = "No se pudo eliminar en servidor. Se registró para intentar luego.";
    messageType.value = "warning";
  }
}

/* ---------- online/offline handlers ---------- */
async function onOnline() {
  // load pending and process deletes/updates/creates
  await syncPendientes();
  // refresh server list to reflect changes
  await getGastos();
}

function onOffline() {
  // nothing additional required
}

/* ---------- lifecycle ---------- */
onMounted(() => {
  loadPendientesFromStorage();
  getGastos();
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  // if already online, try a sync at mount
  if (navigator.onLine) onOnline();
});

onBeforeUnmount(() => {
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
});
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