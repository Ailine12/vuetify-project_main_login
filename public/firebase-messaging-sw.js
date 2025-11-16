
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBsEgnWiY6T5WbJ6lS2oR9JteG5OE9Qlok",
  authDomain: "notificaciones-6a125.firebaseapp.com",
  projectId: "notificaciones-6a125",
  storageBucket: "notificaciones-6a125.firebasestorage.app",
  messagingSenderId: "163580088946",
  appId: "1:163580088946:web:561c157f5510bc4b3ba8eb",
  measurementId: "G-29TDSB125S"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/a.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});