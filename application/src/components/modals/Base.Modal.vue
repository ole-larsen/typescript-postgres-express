<template>
  <CModal v-if="isSuperAdmin || isAdmin"
          :show.sync="darkModal"
          :no-close-on-backdrop="true"
          :centered="true"
          title="Spots"
          size="lg"
          color="dark"
  >
    <template #header>
      <h6 class="modal-title">{{itemForUpdate.id ? "edit" : "create"}}</h6>
      <CButtonClose @click="reset" class="text-white"/>
    </template>
    <template #footer>
      <div></div>
    </template>
    <base-form
        :item-for-update="itemForUpdate"
        :api-error="apiError"
        @reset="reset"
        @update="update"
        @handleChangeEnabled="handleChangeEnabled"
    ></base-form>
  </CModal>
</template>

<script>
import authMixin from '@/mixins/auth'
import BaseForm from '@/components/forms/Base.Form'
export default {
  name: "BaseModal",
  mixins: [authMixin],
  components: {BaseForm},
  props: ['itemForUpdate', 'apiError', 'darkModal'],
  computed: {
    modal() {
      return this.darkModal
    }
  },
  methods: {
    reset () {
      this.$emit('reset', this.itemForUpdate)
    },
    update () {
      this.$emit('update', this.itemForUpdate)
    },
    handleChangeEnabled () {
      this.$emit("handleChangeEnabled", this.itemForUpdate)
    },
  }
}
</script>

<style scoped>

</style>