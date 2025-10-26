<template>
  <v-container
    fluid
    class="d-flex align-center justify-center fill-height gradient-background"
  >
    <v-card
      max-width="400"
      class="pa-6 rounded-lg elevation-6"
    >
      <v-card-title class="justify-center">
        <h2 class="font-weight-bold">Iniciar Sesión</h2>
      </v-card-title>

      <v-alert
        v-if="errorMessage"
        type="error"
        dismissible
        class="mb-4"
      >
        {{ errorMessage }}
      </v-alert>

      <v-card-text>
        <v-form @submit.prevent="login">
          <v-text-field
            v-model="email"
            label="Usuario"
            outlined
            clearable
            dense
            required
            prepend-inner-icon="mdi-account"
            class="mb-4"
          />

          <v-text-field
            v-model="password"
            label="Contraseña"
            type="password"
            outlined
            clearable
            dense
            prepend-inner-icon="mdi-lock"
            class="mb-6"
          />

          <v-btn
            color="primary"
            block
            rounded
            elevation="3"
            type="submit"
            @click="login"
          >
            Ingresar
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center mt-4">
        <v-btn text small @click="router.push('/forgot-password')">
          ¿Olvidaste tu contraseña?
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../config/axios';
import { AxiosError } from 'axios';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();

const login = async () => {
  try {
    if (!email.value || !password.value) {
      errorMessage.value = 'Por favor, completa todos los campos';
      return;
    }

    const response = await axios.post('/login', {
      email: email.value,
      password: password.value,
    });

    if (response.data.acceso === 'Ok') {
      localStorage.setItem('token', response.data.token);
      await router.push('/home');
    } else {
      errorMessage.value = response.data.error;
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      errorMessage.value = err.response?.data?.message || 'Error al iniciar sesión';
    } else {
      errorMessage.value = 'Ocurrió un error inesperado. Inténtalo nuevamente.';
    }
  }
};
</script>

<style scoped>
.gradient-background {
  background: linear-gradient(to right, #9971b1, #77498d);
}
.fill-height {
  height: 100vh;
}
.rounded-lg {
  border-radius: 20px;
}
</style>
