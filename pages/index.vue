<template>
  <v-layout justify-center align-center>
    <v-flex sm10>
      <h1>趣闻</h1>
      <v-timeline dense>
        <v-timeline-item v-for="n in 4" :key="n" color="red lighten-2" fill-dot>
          <template v-slot:opposite>
            <span>Tus eu perfecto</span>
          </template>
          <v-card class="elevation-2">
            <v-card-title class="headline">Lorem ipsum</v-card-title>
            <v-card-text
              class="pt-0"
            >Lorem ipsum dolor sit amet, no nam oblique veritus. Commune scaevola imperdiet nec ut, sed euismod convenire principes at. Est et nobis iisque percipit, an vim zril disputando voluptatibus, vix an salutandi sententiae.</v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </v-flex>
  </v-layout>
</template>

<script>
// import Logo from '~/components/Logo.vue'
// import VuetifyLogo from '~/components/VuetifyLogo.vue'

export default {
  layout: 'home'
  // components: {
  //   Logo,
  //   VuetifyLogo
  // }
}
</script>
