/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes: {
      myTheme: {
        dark: false,
        colors: {
          primary: '#9971b1', // color para app-bar y otros elementos primarios
          secondary: '#77498d', // color para botones o acentos
  },
  
      },
    },
  },
})

// src/plugins/vuetify.ts




