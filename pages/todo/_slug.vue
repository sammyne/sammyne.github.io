<template>
  <div>
    <h1>Todo</h1>
    <div v-html="md.html"></div>
    <v-card>
      <v-card-title>hello world</v-card-title>
      <!--<v-card-text>{{ md.vue.render() }}</v-card-text>-->
      <v-card-text>{{ md.html }}</v-card-text>
      <v-card-text>{{ md.vue.render }}</v-card-text>
      <v-card-text>{{ JSON.stringify(md,null,'' ) }}</v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'Todo',

  async asyncData({ params }) {
    const md = await import(`~/contents/${params.slug}.md`)

    return {
      md: md
    }
  }
}
</script>

