<script lang="ts" setup>
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
const firebaseConfig = {
  apiKey: "AIzaSyBsEgnWiY6T5WbJ6lS2oR9JteG5OE9Qlok",
  authDomain: "notificaciones-6a125.firebaseapp.com",
  projectId: "notificaciones-6a125",
  storageBucket: "notificaciones-6a125.firebasestorage.app",
  messagingSenderId: "163580088946",
  appId: "1:163580088946:web:561c157f5510bc4b3ba8eb",
  measurementId: "G-29TDSB125S"
};

const app = initializeApp(firebaseConfig);


const messaging = getMessaging();
onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // ...
});
getToken(messaging, { vapidKey: 'BMb1u2ETVHKSE0PptvJRVgqT54th9nF9mYJ78BtTRtzpexoWxUFAlW0LbQqCoUVT4_4FnQRTjcz3NtBh7Dnuvow' }).then((currentToken) => {
  if (currentToken) {
    // Send the token to your server and update the UI if necessary
    console.log("Token is:",currentToken);
    // ...
  } else {
    // Show permission request UI
    console.log('No registration token available. Request permission to generate one.');
    // ...
  }
}).catch((err) => {
  console.log('An error occurred while retrieving token. ', err);
  // ...
});
</script>

<template>
  <v-app>
    <v-main>
      <OfflineDialog />
      <router-view />
    </v-main>
  </v-app>
</template>