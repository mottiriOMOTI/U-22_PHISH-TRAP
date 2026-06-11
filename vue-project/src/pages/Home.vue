<template>
  <h1 class="d-flex justify-center">Welcome! {{ userName }}</h1>

  <v-row cols="12" class="margin-3">
    <v-col v-for="item in cards" :key="item.id">
      <BaseCard
        :append-icon="item.appendIcon"
        :title="item.title"
        :subTitle="item.subTitle"
        :text="item.text"
      />
    </v-col>
  </v-row>

  <div class="d-flex flex-column align-center pa-16 margin-3" width="750">
    <h2 class="mb-1 align-self-start">Enter your name</h2>
    <v-text-field
      v-model="userName"
      variant="outlined"
      label="Name"
      color="primary"
      style="width: 100%"
    />
  </div>

  <div>
    <h1>Profile</h1>

    <p v-if="errorMessage" style="color: red">
      {{ errorMessage }}
    </p>

    <div>
      <input v-model="displayName" placeholder="name" />
      <button @click="handleCreate">Add</button>
      <button @click="loadItems">Reload</button>
    </div>

    <p v-if="selectedItem">
      Selected: {{ selectedItem.id }} / {{ selectedItem.display_name || 'No display name' }}
      <template v-if="selectedItem.last_sign_in_at">
        <br />
        最終アクティブ: {{ formatDate(selectedItem.last_sign_in_at) }}
      </template>
    </p>

    <ul>
      <li v-for="item in items" :key="item.id">
        <template v-if="editingId === item.id">
          <input v-model="editingDisplayName" />

          <button @click="handleUpdate(item.id)">Save</button>
          <button @click="cancelEdit">Cancel</button>
        </template>

        <template v-else>
          <strong>{{ item.display_name || 'No display name' }}</strong>

          <button @click="handleFetchOne(item.id)">View</button>
          <button @click="startEdit(item)">Edit</button>
          <button @click="handleDelete(item.id)">Delete</button>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import {
  createItem,
  deleteItem,
  fetchItem,
  fetchItems,
  type Item,
  updateItem,
} from '@/api/supabaseApi.ts'
import { useUserInput } from '@/stores/userInput'
import { onMounted, ref, watch } from 'vue'

const userInput = useUserInput()

class Card {
  id: string
  appendIcon: string
  title: string
  subTitle: string
  text: string

  constructor(appendIcon: string, title: string, subTitle: string, text: string) {
    this.id = appendIcon
    this.appendIcon = appendIcon
    this.title = title
    this.subTitle = subTitle
    this.text = text
  }
}

const userName = ref('')
const cards: Card[] = [
  new Card(
    'mdi-check-bold',
    'check',
    'bold',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  ),
  new Card(
    'mdi-bell-check-outline',
    'bell',
    'outline',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  ),
]

watch(userName, (s) => {
  userInput.userName = s
})

const items = ref<Item[]>([])
const displayName = ref('')
const editingId = ref<string | null>(null)
const editingDisplayName = ref('')
const selectedItem = ref<Item | null>(null)
const errorMessage = ref('')

async function loadItems() {
  try {
    errorMessage.value = ''
    items.value = await fetchItems()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch profile'
  }
}

async function handleCreate() {
  if (!displayName.value.trim()) {
    errorMessage.value = 'Please enter a name'
    return
  }

  try {
    errorMessage.value = ''
    await createItem(displayName.value)
    displayName.value = ''
    await loadItems()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save profile'
  }
}

async function handleFetchOne(id: string) {
  try {
    errorMessage.value = ''
    selectedItem.value = await fetchItem(id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch profile'
  }
}

function startEdit(item: Item) {
  editingId.value = item.id
  editingDisplayName.value = item.display_name ?? ''
}

function cancelEdit() {
  editingId.value = null
  editingDisplayName.value = ''
}

async function handleUpdate(id: string) {
  try {
    errorMessage.value = ''
    await updateItem(id, editingDisplayName.value)
    cancelEdit()
    await loadItems()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to update profile'
  }
}

async function handleDelete(id: string) {
  try {
    errorMessage.value = ''
    await deleteItem(id)
    if (selectedItem.value?.id === id) {
      selectedItem.value = null
    }
    await loadItems()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to delete profile'
  }
}

onMounted(() => {
  loadItems()
})
</script>

<style lang="css" scoped>
.margin-3 {
  margin-top: 2em;
}
</style>
