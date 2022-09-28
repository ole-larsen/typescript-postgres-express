<template>
  <CCard>
    <CCardHeader>
      <CButton @click="create" color="success" v-if="isSuperAdmin || isAdmin">Create Accounts</CButton>
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
              <CButton color="info" size="sm" @click.stop.prevent="editUser(user)" v-bind:key="user.id">
                {{user.username}}
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
              description="account name"
              label="Name"
              horizontal
              autocomplete="name"
              v-model="itemForUpdate.name"
          />
          <CInput
              description="account email"
              label="Email"
              type="email"
              horizontal
              autocomplete="email"
              v-model="itemForUpdate.email"
          />
          <CInput
              description="account status"
              label="Status"
              type="text"
              horizontal
              autocomplete="status"
              v-model="itemForUpdate.status"
          />
          <CRow form class="form-group margin-top-30" v-if="isSuperAdmin">
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
                  track-by="id"></multiselect>
            </CCol>
          </CRow>
          <CRow form class="form-group" v-if="isSuperAdmin && itemForUpdate.id">
            <CCol tag="label" sm="3" class="col-form-label">
              Account enabled
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
        </CForm>
        <template #header>
          <h6 class="modal-title">{{itemForUpdate.id ? "edit" : "create"}} {{itemForUpdate.name}}</h6>
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
import {mapState} from 'vuex'
import {GET_ACCOUNT, GET_ACCOUNTS, REMOVE_ACCOUNT, SET_ACCOUNT} from "@/store/actions/accounts";
import {GET_USERS} from "@/store/actions/users";

export default {
  name: 'Accounts',
  mixins: [authMixin],
  components: { Multiselect },
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
    this.fetch()
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
        name: undefined,
        email: undefined,
        status: undefined,
        enabled: undefined,
        users: []
      }
    }
  },
  methods: {
    create () {
      this.reset()
      this.darkModal = true
    },
    update () {
      this.dispatch(SET_ACCOUNT, this.itemForUpdate)
      this.darkModal = false
    },
    reset () {
      this.itemForUpdate = {
        id: undefined,
        name: undefined,
        email: undefined,
        status: undefined,
        enabled: undefined,
        users: []
      }
      this.darkModal = false
    },
    edit (item) {
      if (item) {
        this.dispatch(GET_ACCOUNT, item)
      }
    },
    editUser (user) {
      this.$emit('editUser', {
        user: this.users.find(u => u.id === user.id)
      })
    },
    remove (item) {
      this.dispatch(REMOVE_ACCOUNT, item)
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
              if (itemForUpdate === GET_ACCOUNT) {
                // copy response to prevent mutations in store
                this.load(JSON.parse(JSON.stringify(response)))
              } else if (itemForUpdate === SET_ACCOUNT) {
                this.reset()
                this.fetch()
              } else if (itemForUpdate === REMOVE_ACCOUNT){
                this.fetch()
              }
            }
            if (response.message) {
              this.apiError.message = response.message
            }
          })
          .catch(e => {
            this.apiError.message = e.message
            this.fetch()
            setTimeout(() => {
              this.apiError.message = undefined;
            }, 10000);
          })
    },
    handleChangeEnabled (item) {
      item.enabled = !item.enabled
      this.dispatch(SET_ACCOUNT, item)
    },
    async fetch () {
      await this.fetchUsers()
      this.$store.dispatch(GET_ACCOUNTS, {url: this.url})
        .then(items => {
          this.tableFields = [
            { key: 'id'},
            { key: 'name', label: '', _classes: 'text-left' },
            { key: 'email' },
            { key: 'status' },
            { key: 'updated' },
            { key: 'enabled', _classes: 'text-left' }
          ]
          if (this.isSuperAdmin || this.isAdmin) {
            this.tableFields.push({ key: 'users' })
            this.tableFields.push({ key: 'controls' })
          }
          this.tableItems = JSON.parse(JSON.stringify(items)).map(account => {
            account.users = account.users
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
            return {
              id:               account.id,
              name:             account.name,
              email:            account.email,
              status:           account.status,
              updated:          account.updated,
              enabled:          account.enabled,
              users:            account.users
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
