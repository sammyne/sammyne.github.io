<template>
  <v-layout row wrap>
    <v-flex md10>
      <v-markdown :render-func="md.vue.render" :static-render-funcs="md.vue.staticRenderFns"/>
    </v-flex>
    <v-flex md2 hidden-xs-only>
      <ul class="md-toc">
        <li class="mb-2" v-for="(h,i) in headings" :key="i">
          <a class="grey--text text--darken-1 subheading" @click="$vuetify.goTo(h.id)">{{ h.text }}</a>
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
      text: h.innerText
    }))

    const focusedClass = ['primary--text', 'focused']

    // previous active anchor
    let focused
    /*
    // an ad-hoc solution addressing the unmounted document
    setTimeout(() => {
      focused = document.querySelector(`ul.md-toc li:nth-child(1) a`)
      if (focused) {
        focused.classList.add(...focusedClass)
      }
    }, 1000)
    */

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

      &:hover {
        text-decoration: underline;
      }

      &.focused {
        border-color: var(--v-primary-darken1);
      }
    }
  }
}
</style>


