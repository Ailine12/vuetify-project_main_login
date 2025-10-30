<template>
  <v-card>
    <v-layout>
      <!-- Barra superior -->
      <v-app-bar tyle="background-color: #9971b1;">
        <v-app-bar-nav-icon
          variant="text"
          @click.stop="drawer = !drawer"
        ></v-app-bar-nav-icon>

        <v-toolbar-title>Panel de Control</v-toolbar-title>

        <template v-if="$vuetify.display.mdAndUp">
          <v-btn icon="mdi-magnify" variant="text"></v-btn>
          <v-btn icon="mdi-filter" variant="text"></v-btn>
        </template>

        <v-btn icon="mdi-dots-vertical" variant="text"></v-btn>
      </v-app-bar>

      <!-- Drawer lateral -->
      <v-navigation-drawer
        v-model="drawer"
        :location="$vuetify.display.mobile ? 'bottom' : undefined"
        temporary
      >
        <v-list>
          <v-list-item
            v-for="item in items"
            :key="item.title"
            @click="goTo(item.route)"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- Contenido dinámico -->
      <v-main>
        <v-container class="pa-4">
          <slot></slot>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const drawer = ref(false)
const group = ref(null)

const goTo = (ruta) => {
  router.push(ruta)
  drawer.value = false
}

const items = [
  { title: 'Registrar Gasto', route: '/gastos' },
  { title: 'Ver Gastos', route: '/vergastos' },
  { title: 'Fizz', route: '/fizz' },
  { title: 'Buzz', route: '/buzz' },
]

watch(group, () => {
  drawer.value = false
})
</script>
