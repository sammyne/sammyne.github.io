<template></template>

<script>
export default {
  props: ['renderFunc', 'staticRenderFuncs'],
  data() {
    return {
      templateRender: null
    }
  },
  created() {
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

