<template>
  <div>
    <!--
      <v-card-title>hello world</v-card-title>
      <v-card-text>{{ md.html }}</v-card-text>
      <v-card-text>{{ md.vue.render }}</v-card-text>
      <v-card-text>{{ JSON.stringify(md,null,'' ) }}</v-card-text>
    -->
    <v-markdown :render-func="md.vue.render" :static-render-funcs="md.vue.staticRenderFns"/>

    <!--<v-card-text>{{ md.html }}</v-card-text>-->
  </div>
</template>

<script>
import VMarkdown from '~/components/VMarkdown'

export default {
  name: 'Todo',
  layout: 'home',

  async asyncData({ params }) {
    const md = await import(`~/contents/${params.slug}.md`)

    return {
      md: md
    }
  },

  components: { VMarkdown }
}
</script>

