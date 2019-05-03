<template>
  <v-app>
    <navbar/>
    <v-content>
      <v-container grid-list-md>
        <nuxt/>
      </v-container>
    </v-content>
    <v-footer class="pa-3">
      <v-layout justify-center>&copy; 2019 - Sammy</v-layout>
    </v-footer>
  </v-app>
</template>

<script>
import Navbar from '~/components/Navbar'

export default {
  components: { Navbar }
}
</script>

