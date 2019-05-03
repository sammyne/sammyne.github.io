import Vue from 'vue'
import Vuetify, { VLayout, VList } from 'vuetify/lib'
// import colors from 'vuetify/es5/util/colors'

import 'highlight.js/styles/github.css'

// import the component for customizing tag for v-data-iterator
Vue.use(Vuetify, {
  components: {
    VLayout,
    VList
  },
  options: {
    customProperties: true
  }
  /*
  theme: {
    primary: '#121212', // a color that is not in the material colors palette
    accent: colors.grey.darken3,
    secondary: colors.amber.darken3,
    info: colors.teal.lighten1,
    warning: colors.amber.base,
    error: colors.deepOrange.accent4,
    success: colors.green.accent3
  }
  */
})
