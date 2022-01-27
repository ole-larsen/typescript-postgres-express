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
              description="account uid"
              label="UID"
              type="text"
              horizontal
              autocomplete="uid"
              v-model="itemForUpdate.uid"
          />
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
              description="account fid"
              label="Fargo ID"
              type="text"
              horizontal
              autocomplete="fid"
              v-model="itemForUpdate.fid"
          />
          <CInput
              description="account fid"
              label="Customer Portal ID"
              type="text"
              horizontal
              autocomplete="customerPortalId"
              v-model="itemForUpdate.customerPortalId"
          />
          <CInput
              description="account status"
              label="Status"
              type="text"
              horizontal
              autocomplete="status"
              v-model="itemForUpdate.status"
          />
          <CRow form class="form-group" v-if="isSuperAdmin">
            <CCol tag="label" sm="3" class="col-form-label">
              Account Type
            </CCol>
            <CCol sm="9">

              <CSelect
                  horizontal
                  :value.sync="itemForUpdate.type"
                  :options="selectOptions"
                  placeholder="Please select"
              />
            </CCol>
          </CRow>
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
import {GET_ACCOUNT, GET_ACCOUNTS, REMOVE_ACCOUNT, SET_ACCOUNT, SET_ACCOUNT_ENABLE} from "../../store/actions/accounts";
import {GET_USERS} from "../../store/actions/users";

export default {
  name: 'Accounts',
  mixins: [authMixin],
  components: { Multiselect },
  props: ['_account', '_accounts'],
  watch: {
    _accounts: {
      immediate: true,
      handler () {
        this.fetchAccounts()
      }
    },
    _account: {
      immediate: true,
      handler (account) {
        this.edit(account)
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
    this.fetchAccounts()
  },
  data () {
    return {
      selectOptions: [
        'ltv', 'swap', 'svf'
      ],
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
        uid: undefined,
        fid: undefined,
        customerPortalId: undefined,
        type: undefined,
        status: undefined,
        enabled: undefined,
        users: undefined
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
    },
    reset () {
      this.itemForUpdate = {
        id: undefined,
        name: undefined,
        email: undefined,
        uid: undefined,
        fid: undefined,
        customerPortalId: undefined,
        type: undefined,
        status: undefined,
        enabled: undefined,
        users: undefined
      }
      this.darkModal = false
    },
    edit (account) {
      if (account) {
        this.dispatch(GET_ACCOUNT, account)
      }
    },
    editUser (user) {
      this.$emit('editUser', {
        user: this.users.find(u => u.id === user.id)
      })
    },
    remove (account) {
      this.dispatch(REMOVE_ACCOUNT, account)
    },
    loadAccount(account) {
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
      this.itemForUpdate = account
      this.darkModal = true
    },
    dispatch (itemForUpdate, account) {
      this.apiError.message = undefined
      this.$store.dispatch(itemForUpdate, {url: this.url, account: account})
          .then(r => {
            if (r.account) {
              if (itemForUpdate === GET_ACCOUNT) {
                // copy role to prevent mutations in store
                this.loadAccount(JSON.parse(JSON.stringify(r.account)))
              } else if (itemForUpdate === SET_ACCOUNT) {
                this.reset()
                this.fetchUsers()
              } else if (itemForUpdate === SET_ACCOUNT_ENABLE) {
                this.fetchAccounts()
              } else if (itemForUpdate === REMOVE_ACCOUNT){
                this.fetchAccounts()
              } else {
                console.log(itemForUpdate, r.account)
              }
            }
            if (r.accounts) {
              console.log(r.accounts)
              this.fetchAccounts()
            }
            if (r.message) {
              console.log(r)
            }
          })
          .catch(e => {
            console.log(e)
            this.apiError.message = e.message
            this.fetchAccounts()
            setTimeout(() => {
              this.apiError.message = undefined;
            }, 10000);
          })
    },
    handleChangeEnabled (item) {
      item.enabled = !item.enabled
      this.dispatch(SET_ACCOUNT_ENABLE, item)
    },
    fetchAccounts () {
      this.$store.dispatch(GET_ACCOUNTS, {url: this.url})
        .then(accounts => {
          this.tableFields = [
            { key: 'id'},
            { key: 'name', label: '', _classes: 'text-left' },
            { key: 'email' },
            { key: 'fid' },
            { key: 'uid' },
            { key: 'customerPortalId' },
            { key: 'type' },
            { key: 'status' },
            { key: 'updated' },
            { key: 'enabled', _classes: 'text-left' }
          ]
          if (this.isSuperAdmin || this.isAdmin) {
            this.tableFields.push({ key: 'users' })
            this.tableFields.push({ key: 'controls' })
          }
          this.tableItems = JSON.parse(JSON.stringify(accounts)).map(account => {
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
              fid:              account.fid,
              uid:              account.uid,
              customerPortalId: account.customerPortalId,
              type:             account.type,
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
              this.fetchAccounts()
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
