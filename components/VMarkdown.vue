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

  &[class*='language-'] {
    box-shadow: none;
  }

  .highlighted-line {
    background-color: #14161a;
    display: block;
    margin: 0 -1.575rem;
    padding: 0 1.575rem;
  }

  span.line-idx {
    border-right: 1px solid black;
    display: inline-block; /* make the height of span adjustable */
    padding-right: 8px;
  }
}

h1, h2, h3, h4, h5, h6 {
  a.header-anchor {
    display: none;
  }

  &:hover {
    a.header-anchor {
      display: inline;
    }
  }
}
</style>
