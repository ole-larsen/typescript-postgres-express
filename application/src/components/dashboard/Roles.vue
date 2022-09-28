<template>
  <CCard>
    <CCardHeader>
      <CButton @click="create" color="success" v-if="isSuperAdmin || isAdmin">Create Roles</CButton>
    </CCardHeader>
    <CCardBody>
      <CAlert show color="danger" v-if="apiError.message" v-html="apiError.message">Danger Alert</CAlert>
      <CDataTable
          class="mb-0 table-outline"
          hover
          :items="tableItems"
          :fields="tableFields"
          head-color="light"
          no-sorting
          selectable
      >

        <td slot="enabled" slot-scope="{item}">
          <CSwitch v-if="isSuperAdmin || isAdmin"
              class="center"
              size="sm"
              shape="pill"
              color="info"
              data-on="On"
              data-off="Off"
              :checked="item.enabled"
              @update:checked="handleChangeEnabled(item)"
          />
          <template v-else>
            {{item.enabled ? 'enabled' : 'disabled'}}
          </template>
        </td>

        <td slot="users" slot-scope="{item}" class="edit-relation" v-if="isSuperAdmin || isAdmin">
          <CButtonGroup>
            <template v-for="(user) in item.users">
              <CButton color="info" size="sm" @click.stop.prevent="editUser(user)" v-bind:key="user.value">
                {{user.label}}
              </CButton>
            </template>
          </CButtonGroup>
        </td>

        <td slot="controls" slot-scope="{item}" v-if="isSuperAdmin || isAdmin">
          <CButtonGroup>
            <CButton color="link" @click.stop.prevent="edit(item)">Edit</CButton>
            <CButton color="danger" @click.stop.prevent="remove(item)" v-if="isSuperAdmin">Remove</CButton>
          </CButtonGroup>
        </td>
      </CDataTable>
      <CModal v-if="isSuperAdmin || isAdmin"
          :show.sync="darkModal"
          :no-close-on-backdrop="true"
          :centered="true"
          title="Roles"
          size="lg"
          color="dark"
      >
        <CAlert show color="danger" v-if="apiError.message" v-html="apiError.message">Danger Alert</CAlert>
        <CForm>
          <CInput
              description="Unique system role title"
              label="Title"
              horizontal
              autocomplete="name"
              v-model="itemForUpdate.title"
          />
          <CTextarea
              label="Role description"
              placeholder="Content..."
              v-model="itemForUpdate.description"
              horizontal
              rows="9"
          />
          <CRow form class="form-group" v-if="itemForUpdate.id && isSuperAdmin">
            <CCol tag="label" sm="3" class="col-form-label">
              Role enabled
            </CCol>
            <CCol sm="9">
              <CSwitch
                  class="mr-1"
                  color="primary"
                  :checked="itemForUpdate.enabled"
                  @update:checked="handleChangeEnabled(itemForUpdate)"
                  shape="pill"
              />
            </CCol>
          </CRow>
          <CRow form class="form-group" v-if="itemForUpdate.id && isSuperAdmin">
            <CCol tag="label" sm="3" class="col-form-label">
              Users
            </CCol>
            <CCol sm="9">
              <multiselect
                  v-model="itemForUpdate.users"
                  :options="users"
                  :multiple="true"
                  :close-on-select="false"
                  placeholder="Select users"
                  label="username"
                  track-by="username"></multiselect>
            </CCol>
          </CRow>

        </CForm>
        <template #header>
          <h6 class="modal-title">{{itemForUpdate.id ? "edit" : "create"}} {{itemForUpdate.title}}</h6>
          <CButtonClose @click="reset" class="text-white"/>
        </template>
        <template #footer>
          <CButton @click="reset" color="danger">Discard</CButton>
          <CButton @click="update" color="success">{{itemForUpdate.id ? "Update" : "Create"}}</CButton>
        </template>
      </CModal>
    </CCardBody>
  </CCard>
</template>
<script>
import Multiselect from 'vue-multiselect'
import authMixin from '@/mixins/auth'
import {GET_ROLE, GET_ROLES, REMOVE_ROLE, SET_ROLE} from "@/store/actions/roles"
import {mapState} from 'vuex'
import {GET_USERS} from "@/store/actions/users"

export default {
  name: 'Roles',
  mixins: [authMixin],
  components: { Multiselect },
  props: ['_role', '_roles'],
  watch: {
    _roles: {
      immediate: true,
      handler () {
        this.fetch()
      }
    },
    _role: {
      immediate: true,
      handler (role) {
        this.edit(role)
      }
    }
  },
  computed: {
    ...mapState({
      users: state => state.users.users.map(user => {
        return {
          id: user.id,
          username: user.username,
          email: user.email
        }
      })
    })
  },
  mounted () {
    if (this.users.length === 0) {
      this.fetchUsers()
    }
  },
  data () {
    return {
      apiError: {
        message: undefined
      },
      tableItems: [],
      tableFields: [],
      darkModal: false,
      itemForUpdate: {
        id: undefined,
        title: undefined,
        description: undefined,
        enabled: undefined,
        users: undefined,
      }
    }
  },
  methods: {
    create () {
      this.reset()
      this.darkModal = true
    },
    update () {
      if (this.itemForUpdate.users && this.itemForUpdate.id) {
        this.itemForUpdate.users = this.itemForUpdate.users.map(user => user.id)
      }
      this.dispatch(SET_ROLE, this.itemForUpdate)
    },
    reset () {
      this.itemForUpdate = {
        id: undefined,
        title: undefined,
        description: undefined,
        enabled: undefined,
        users: undefined
      }
      this.darkModal = false
    },
    edit (item) {
      if (item) {
        this.dispatch(GET_ROLE, item)
      }
    },
    editUser (user) {
      this.$emit('editUser', {
        user: this.users.find(u => u.id === user.value)
      })
    },
    remove (item) {
      this.dispatch(REMOVE_ROLE, item)
    },
    load(item) {
      item.users = item.users
          .map(userId => {
            const user = this.users.find(user => user.id === userId)
            if (user) {
              return {
                id: user.id,
                username: user.username,
                email: user.email
              }
            }
          })
          .filter(user => !!user)
      this.itemForUpdate = item
      this.darkModal = true
    },
    dispatch (itemForUpdate, item) {
      this.apiError.message = undefined
      this.$store.dispatch(itemForUpdate, {url: this.url, item})
          .then(response => {
            if (response.id) {
              if (itemForUpdate === GET_ROLE) {
                // copy response to prevent mutations in store
                this.load(JSON.parse(JSON.stringify(response)))
              } else if (itemForUpdate === SET_ROLE) {
                this.reset()
                this.fetchUsers()
              } else if (itemForUpdate === REMOVE_ROLE){
                this.fetchUsers()
              } else {
                console.log(itemForUpdate, response.role)
              }
            }
            if (response.roles) {
              this.fetch()
            }
            if (response.message) {
              console.log(response)
            }
          })
          .catch(e => {
            console.log(e)
            this.apiError.message = e.message
            this.fetch()
            this.fetchUsers()
            setTimeout(() => {
              this.apiError.message = undefined;
            }, 10000);
          })
    },
    handleChangeEnabled (item) {
      item.enabled = !item.enabled
      this.dispatch(SET_ROLE, item)
    },
    fetch () {
      this.$store.dispatch(GET_ROLES, {url: this.url})
        .then(items => {
          this.tableFields = [
            { key: 'id'},
            { key: 'title', label: '', _classes: 'text-left' },
            { key: 'description' },
            { key: 'updated' },
            { key: 'enabled', _classes: 'text-left' }
          ]
          if (this.isSuperAdmin || this.isAdmin) {
            this.tableFields.push({ key: 'users' })
            this.tableFields.push({ key: 'controls' })
          }
          this.tableItems = items.map(role => {
            const users = role.users.map(userId => {
              const user = this.users.find(user => user.id === userId)
              if (user && user.username) {
                return {label: user.username, value: user.id}
              }
            }).filter(user => !!user)
            return {
              id:          role.id,
              title:       role.title,
              description: role.description,
              enabled:     role.enabled,
              created:     role.created,
              updated:     role.updated,
              users:       users
            }
          })
        })
        .catch(e => {
          console.log(e)
        })
    },
    fetchUsers () {
      this.$store.dispatch(GET_USERS, {url: this.url})
          .then(users => {
            if (users) {
              this.fetch()
              this.$emit('updateUsers', {
                users: users
              })
            }
          })
          .catch(e => {
            console.log(e)
          })
    }
  }
}
</script>
