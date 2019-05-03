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
          <v-list-tile :key="item.link" inset>
            <v-list-tile-content>
              <v-list-tile-title>{{ item.name }}</v-list-tile-title>
              <v-list-tile-sub-title>
                <!--
                <v-icon>mdi-clock-outline</v-icon>
                -->
                Last Updated: {{ item.modifiedTime }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn icon ripple :to="item.link">
                <v-icon color="primary">mdi-open-in-new</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
          <v-divider v-if="!isLast(index)" :key="index"/>
        </template>
      </v-data-iterator>
    </v-flex>
  </v-layout>
</template>

<script>
import rawTodos from '~/contents/todo'

import dayjs from 'dayjs'

export default {
  layout: 'home',
  data() {
    return {
      pagination: {
        rowPerPage: 4
      },
      rawTodos
    }
  },
  computed: {
    todos() {
      return this.rawTodos.map(todo => ({
        ...todo,
        modifiedTime: dayjs(todo.mtimeMs).format('YYYY/MM/DD HH:mm:ss'),
        link: `/todo/${todo.name}`
      }))
    }
  },
  methods: {
    isLast(i) {
      return (
        i === this.todos.length - 1 ||
        0 === (i + 1) % this.pagination.rowPerPage
      )
    }
  }
}
</script>

