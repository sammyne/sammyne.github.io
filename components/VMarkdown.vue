<script>
export default {
  props: {
    renderFunc: {
      type: String, // the passed in renderer is a string not a function
      required: true
    },
    staticRenderFuncs: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      templateRender: null
    }
  },

  created() {
    /* eslint no-new-func: "off" */
    this.templateRender = new Function(this.renderFunc)()
    this.$options.staticRenderFns = new Function(this.staticRenderFuncs)()
  },
  render(createElement) {
    return this.templateRender
      ? this.templateRender()
      : createElement('div', 'rendering')
  }
}
</script>

<style lang="stylus" scoped>
/* @import 'highlight.js/styles/github.css'; */
code {
  &:before {
    content: none !important;
  }

  &:after {
    content: none !important;
  }
}
</style>
