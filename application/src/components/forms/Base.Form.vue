<template>
  <div>
    <CAlert show color="danger" v-if="apiError.message" v-html="apiError.message">Danger Alert</CAlert>
    <CForm :class="itemForUpdate.id ? 'edit-form' : ''">
      <template v-for="(field, index) in fields">
        <CInput v-if="itemForUpdate.hasOwnProperty(field) && typeof itemForUpdate[field] !== 'boolean' && typeof itemForUpdate[field] !== 'object'" v-bind:key="'input' + index"
                :description="field[0].toUpperCase() + field.slice(1).replace(/(.)([A-Z][a-z]+)/, '$1 $2').replace(/([a-z0-9])([A-Z])/, '$1 $2')"
                :label="field[0].toUpperCase() + field.slice(1).replace(/(.)([A-Z][a-z]+)/, '$1 $2').replace(/([a-z0-9])([A-Z])/, '$1 $2')"
                horizontal
                v-model="itemForUpdate[field]"
        />
        <template v-if="typeof itemForUpdate[field] === 'object'" v-for="(value, key) in itemForUpdate[field]">
          <CInput v-if="itemForUpdate[field].hasOwnProperty(key) && typeof itemForUpdate[field][key] !== 'boolean' && typeof itemForUpdate[field][key] !== 'object'" v-bind:key="'input' + field + key + index"
                  :description="key[0].toUpperCase() + key.slice(1).replace(/(.)([A-Z][a-z]+)/, '$1 $2').replace(/([a-z0-9])([A-Z])/, '$1 $2')"
                  :label="key[0].toUpperCase() + key.slice(1).replace(/(.)([A-Z][a-z]+)/, '$1 $2').replace(/([a-z0-9])([A-Z])/, '$1 $2')"
                  horizontal
                  v-model="itemForUpdate[field][key]"
          />
        </template>

        <CRow form class="form-group" v-if="itemForUpdate.id && typeof itemForUpdate[field] === 'boolean'" v-bind:key="'switch' + index">
          <CCol tag="label" sm="3" class="col-form-label">
            {{field}}
          </CCol>
          <CCol sm="9">
            <CSwitch
                class="mr-1"
                color="primary"
                :checked="itemForUpdate[field]"
                @update:checked="handleChange(field)"
                shape="pill"
            />
          </CCol>
        </CRow>
      </template>
      <template>
        <CButton @click="reset" color="danger">Discard</CButton>
        <CButton @click="update" color="success">{{itemForUpdate.id ? "Update" : "Create"}}</CButton>
      </template>
    </CForm>
  </div>
</template>

<script>
import authMixin from '@/mixins/auth'
export default {
  name: 'BaseForm',
  mixins: [authMixin],
  props: ['itemForUpdate', 'apiError'],
  computed: {
    fields() {
      return Object.keys(this.itemForUpdate)
    }
  },
  methods: {
    reset () {
      this.$emit('reset', this.itemForUpdate)
    },
    update () {
      this.$emit('update', this.itemForUpdate)
    },
    handleChange (field) {
      if (field === 'enabled') {
        this.handleChangeEnabled()
      }
    },
    handleChangeEnabled () {
      this.$emit("handleChangeEnabled", this.itemForUpdate)
    },
  }
}
</script>

<style lang="scss">
  .edit-form {
    .col-form-label {
      flex: 0 0 20%;
      max-width: 240px;
    }
    .form-control {
      width: 50%;
      max-width: 486px;
    }
    small.form-text {
      display: none;
    }
  }
</style>