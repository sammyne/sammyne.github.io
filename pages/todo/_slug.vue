<template>
  <v-layout row wrap>
    <v-flex class="headline" md10 v-if="md.attributes.title">
      <h1>{{ md.attributes.title }}</h1>
    </v-flex>
    <v-flex md10 class="font-weight-bold grey--text text--darken-1">
      <span>{{ md.attributes.author || "unknown" }}</span>
      <v-divider class="mx-2" vertical></v-divider>
      <span>2019-05-13</span>
    </v-flex>
    <v-flex class="font-weight-bold" sm12>
      <v-chip
        v-for="tag in md.attributes.tags"
        :key="tag"
        label
        outline
        small
        text-color="grey darken-1"
      >
        <v-icon class="mr-1" left>mdi-label</v-icon>
        {{ tag }}
      </v-chip>
    </v-flex>
    <v-flex sm12 md10>
      <v-divider></v-divider>
    </v-flex>
    <v-flex md10>
      <v-markdown :render-func="md.vue.render" :static-render-funcs="md.vue.staticRenderFns"/>
    </v-flex>
    <v-flex md2 hidden-xs-only>
      <ul class="md-toc">
        <li class="mb-2" v-for="(h,i) in headings" :key="i">
          <a
            v-if="h.text.length>32"
            class="grey--text text--darken-1 subheading"
            @click="$vuetify.goTo(h.id)"
            :title="h.text"
          >{{ h.text.slice(0,32) }}</a>
          <a
            v-else
            class="grey--text text--darken-1 subheading"
            @click="$vuetify.goTo(h.id)"
          >{{ h.text }}</a>
        </li>
      </ul>
    </v-flex>
  </v-layout>
</template>

<script>
import Vue from 'vue'
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

  components: { VMarkdown },
  data() {
    return {
      headings: null,
      offsetTop: 0
    }
  },
  destroyed() {
    window.onscroll = () => {}
  },
  mounted() {
    const headings = Array.from(document.querySelectorAll('h1'))

    this.headings = headings.map(h => ({
      id: `#${h.id}`,
      offsetTop: h.offsetTop,
      // trim and merge continuous whitespaces
      text: h.innerText.trim().replace(/\s+/g, ' ')
    }))

    const focusedClass = ['primary--text', 'focused']

    // previous active anchor
    let focused
    // a more elegant solution addressing init
    Vue.nextTick(() => {
      focused = document.querySelector(`ul.md-toc li:nth-child(1) a`)
      //console.log(world)
      if (focused) {
        focused.classList.add(...focusedClass)
      }
    })

    window.onscroll = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop
      this.offsetTop = scrollTop

      if (focused) {
        focused.classList.remove(...focusedClass)
      }

      let i = 0
      for (const h of this.headings) {
        if (h.offsetTop > scrollTop) {
          break
        }
        i++
      }

      i = i || 1
      focused = document.querySelector(`ul.md-toc li:nth-child(${i}) a`)
      if (focused) {
        focused.classList.add(...focusedClass)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.md-toc {
  list-style: none;
  position: fixed;
  /* 48 is the height of toolbar, */
  /* 24 is the padding of container */
  top: calc(48px + 24px);

  li {
    a {
      border-left: 2px solid transparent;
      padding-left: 16px;
      text-decoration: none;
      transition: color 0.1s ease-in;

      &.focused {
        border-color: var(--v-primary-darken1);
      }
    }

    &:hover {
      /* box-shadow below is an alias to that of .elevation-1 in vuetify */
      /*
      box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12) !important;
      */
      background-color: #EEEEEE;
    }
  }
}
</style>


