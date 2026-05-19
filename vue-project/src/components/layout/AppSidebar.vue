<template>
  <v-navigation-drawer :permanent="true" width="260">
    <v-list nav>
      <v-list-item title="Home" to="/" prepend-icon="mdi-home" />
      <v-list-item title="About" to="/about" prepend-icon="mdi-information-outline" />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts"></script>
