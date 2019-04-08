<template>
  <v-toolbar dense>
    <!--
    <v-toolbar-side-icon></v-toolbar-side-icon>
    -->
    <v-toolbar-title>Sammyne</v-toolbar-title>
    <v-spacer/>
    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn flat :href="panel.link" v-for="panel in panels" :key="panel.name">{{ panel.name }}</v-btn>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
export default {
  data() {
    return {
      panels: [
        {
          name: '主页',
          link: '/todo/to-do'
        }
      ]
    }
  }
}
</script>
