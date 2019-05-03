<template>
  <v-layout row justify-center>
    <v-flex sm10>
      <v-data-iterator
        :items="todos"
        :pagination.sync="pagination"
        :content-props="{'two-line':true}"
        rows-per-page-text="每页个数"
        content-tag="v-list"
      >
        <template #header>
          <v-subheader class="headline">待办清单</v-subheader>
        </template>
        <template #item="{item, index}">
          <v-list-tile :key="item" inset>
            <v-list-tile-content>
              <v-list-tile-title>{{ item }}</v-list-tile-title>
              <v-list-tile-sub-title>{{ item }}</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider v-if="!isLast(index)" :key="index"/>
        </template>
      </v-data-iterator>
    </v-flex>
  </v-layout>
</template>

<script>
import todos from '~/contents/todo'

export default {
  layout: 'home',
  data() {
    return {
      pagination: {
        rowPerPage: 4
      },
      todos
    }
  },
  methods: {
    isLast(i) {
      return (
        i === todos.length - 1 || 0 === (i + 1) % this.pagination.rowPerPage
      )
    }
  }
}
</script>

