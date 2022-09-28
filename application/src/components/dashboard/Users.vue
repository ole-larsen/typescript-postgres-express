<template>
  <CCard>
    <CCardHeader>
      <CButton @click="create" color="success" v-if="isSuperAdmin || isAdmin">Create Users</CButton>
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
              @update:checked="handleEnabled(item)"
          />
          <template v-else>
            {{item.enabled ? 'enabled' : 'disabled'}}
          </template>
        </td>

        <td slot="roles" slot-scope="{item}" class="edit-relation">
          <CButtonGroup>
            <template v-for="(role) in item.roles">
              <CButton color="info" size="sm" @click.stop.prevent="editRole(role)">
                {{role.label}}
              </CButton>
            </template>
          </CButtonGroup>
        </td>

        <td slot="accounts" slot-scope="{item}" class="edit-relation">
          <CButtonGroup>
            <template v-for="(account) in item.accounts">
              <CButton color="info" size="sm" @click.stop.prevent="editAccount(account)">
                {{account.label}}
              </CButton>
            </template>
          </CButtonGroup>
        </td>

        <td slot="controls" slot-scope="{item}">
          <CButtonGroup>
            <CButton color="link" @click.stop.prevent="edit(item)">Edit</CButton>
            <CButton color="danger" @click.stop.prevent="remove(item)" v-if="isSuperAdmin">Remove</CButton>
          </CButtonGroup>
        </td>
        <td slot="gravatar" slot-scope="{item}">
          <img :src="item.gravatar" width="20px"/>
        </td>
        <td slot="action" slot-scope="{item}">
          <img :src="item.action" width="20px"/>
        </td>

      </CDataTable>
      <CModal v-if="isSuperAdmin || isAdmin"
          :show.sync="darkModal"
          :no-close-on-backdrop="true"
          :centered="true"
          title="Users"
          size="lg"
          color="dark"
      >
        <CAlert show color="danger" v-if="apiError.message" v-html="apiError.message">Danger Alert</CAlert>
        <CForm>
          <CInput
              description="Unique username"
              label="Title"
              horizontal
              autocomplete="name"
              v-model="itemForUpdate.username"
          />
          <CInput
              description="Unique email"
              label="Email"
              horizontal
              type="email"
              autocomplete="email"
              v-model="itemForUpdate.email"
          />
          <CInput v-if="!itemForUpdate.id"
              placeholder="Password"
              label="Password"
              horizontal
              type="password"
              autocomplete="new-password"
              v-model="itemForUpdate.password"
          >
            <template #prepend-content><CIcon name="cil-lock-locked"/></template>
          </CInput>
          <CInput v-if="!itemForUpdate.id"
              placeholder="Repeat password"
              label="Repeat password"
              horizontal
              type="password"
              autocomplete="new-password"
              class="mb-4"
              v-model="itemForUpdate.confirm"
          >
            <template #prepend-content><CIcon name="cil-lock-locked"/></template>
          </CInput>
          <CRow form class="form-group" v-if="itemForUpdate.id && isSuperAdmin">
            <CCol tag="label" sm="3" class="col-form-label">
              User enabled
            </CCol>
            <CCol sm="9">
              <CSwitch
                  class="mr-1"
                  color="primary"
                  :checked="itemForUpdate.enabled"
                  @update:checked="handleEnabled(itemForUpdate)"
                  shape="pill"
              />
            </CCol>
          </CRow>
          <CRow form class="form-group" v-if="itemForUpdate.id && itemForUpdate.secret !== '' && isSuperAdmin">
            <CCol tag="label" sm="3" class="col-form-label">
              Reset 2FA
            </CCol>
            <CCol sm="9">
              <CSwitch
                  class="mr-1"
                  color="primary"
                  :checked="itemForUpdate.secret === ''"
                  @update:checked="handle2FA(itemForUpdate)"
                  shape="pill"
              />
            </CCol>
          </CRow>
          <CRow form class="form-group" v-else>
            <CCol tag="label" sm="3" class="col-form-label">
              Reset 2FA
            </CCol>
            <CCol sm="9">
              Login to get new 2FA
            </CCol>
          </CRow>
          <CRow form class="form-group" v-if="roles && itemForUpdate.id && isSuperAdmin">
            <CCol tag="label" sm="3" class="col-form-label">
              Roles
            </CCol>
            <CCol sm="9">
              <multiselect
                  v-model="itemForUpdate.roles"
                  :options="roles"
                  :multiple="true"
                  :close-on-select="false"
                  placeholder="Select roles"
                  label="title"
                  track-by="title"></multiselect>
            </CCol>
          </CRow>
          <CRow form class="form-group margin-top-30" v-if="accounts && itemForUpdate.id && isSuperAdmin">
            <CCol tag="label" sm="3" class="col-form-label">
              Accounts
            </CCol>
            <CCol sm="9">
              <multiselect
                  v-model="itemForUpdate.accounts"
                  :options="accounts"
                  :multiple="true"
                  :close-on-select="false"
                  placeholder="Select accounts"
                  label="title"
                  track-by="title"></multiselect>
            </CCol>
          </CRow>
        </CForm>
        <template #header>
          <h6 class="modal-title">{{itemForUpdate.id ? "edit" : "create"}} {{itemForUpdate.username}}</h6>
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
import authMixin from "@/mixins/auth"
import {GET_USER, GET_USERS, REMOVE_USER, SET_USER} from "@/store/actions/users"
import {mapState} from "vuex"
import {GET_ROLES} from "@/store/actions/roles"
import Multiselect from "vue-multiselect"
import {GET_ACCOUNTS} from "@/store/actions/accounts";
import moment from "moment";

export default {
  name: "Users",
  mixins: [authMixin],
  components: {
    Multiselect
  },
  props: ["_user", "_users"],
  watch: {
    _users: {
      immediate: true,
      handler () {
        this.fetch()
      }
    },
    _user: {
      immediate: true,
      handler (user) {
        this.edit(user)
      }
    }
  },
  computed: {
    ...mapState({
      roles: state => state.roles.roles.map(role => {
        return {
          id: role.id,
          title: role.title
        }
      }),
      accounts: state => state.accounts.accounts.map(account => {
        return {
          id: account.id,
          title: account.name
        }
      }),
      currentUser: state => {
        if (state && state.auth && state.auth.user) {
          return state.auth.user
        }
        return null
      }
    })
  },
  mounted () {
    if (this.roles && this.roles.length === 0) {
      this.fetchRoles()
    }
    if (this.accounts && this.accounts.length === 0) {
      this.fetchAccounts()
    }
  },
  data () {
    return {
      apiError: {
        message: undefined
      },
      tableItems: [],
      tableFields: [],
      itemForUpdate: {
        id: undefined,
        username: undefined,
        email: undefined,
        enabled: undefined,
        password: undefined,
        confirm: undefined,
        secret: undefined,
        roles: undefined,
        accounts: undefined
      },
      darkModal: false
    }
  },
  methods: {
    create () {
      this.reset()
      this.darkModal = true
    },
    update () {
      if (this.itemForUpdate.roles && this.itemForUpdate.id) {
        this.itemForUpdate.roles = this.itemForUpdate.roles.map(role => role.id)
      }
      if (this.itemForUpdate.accounts && this.itemForUpdate.id) {
        this.itemForUpdate.accounts = this.itemForUpdate.accounts.map(account => account.id)
      }

      this.dispatch(SET_USER, this.itemForUpdate)
    },
    reset () {
      this.itemForUpdate = {
        id: undefined,
        username: undefined,
        email: undefined,
        enabled: undefined,
        password: undefined,
        confirm: undefined,
        secret: undefined,
        roles: undefined,
        accounts: undefined
      }
      this.darkModal = false
    },
    edit (item) {
      this.dispatch(GET_USER, item)
    },
    editRole (role) {
      this.$emit("editRole", {
        role: this.roles.find(r => r.id === role.value)
      })
    },
    editAccount (account) {
      this.$emit("editAccount", {
        account: this.accounts.find(a => a.id === account.value)
      })
    },
    remove (item) {
      this.dispatch(REMOVE_USER, item)
    },
    load(item) {
      item.roles = item.roles
        .map(roleId => {
          const role = this.roles.find(role => role.id === roleId)
          if (role) {
            return {
              id: role.id,
              title: role.title
            }
          }
        })
        .filter(role => !!role)
      item.accounts = item.accounts
          .map(accountId => {
            const account = this.accounts.find(account => account.id === accountId)
            if (account) {
              return {
                id: account.id,
                title: account.title
              }
            }
          })
          .filter(account => !!account)
      this.itemForUpdate = item
      this.darkModal = true
    },
    dispatch (itemForUpdate, item) {
      this.apiError.message = undefined
      this.$store.dispatch(itemForUpdate, {url: this.url, item})
          .then(response => {
            if (response.id) {
              if (itemForUpdate === GET_USER) {
                // copy response to prevent mutations in store
                this.load(JSON.parse(JSON.stringify(response)))
              } else if (itemForUpdate === SET_USER) {
                this.reset()
                this.fetchRoles()
                this.fetchAccounts()
              } else if (itemForUpdate === REMOVE_USER){
                this.fetchRoles()
              } else {
                console.log(itemForUpdate, response.user)
              }
            }
            if (response.users) {
              this.fetch()
            }
            if (response.message) {
              console.log(response)
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
    handleEnabled (item) {
      item.enabled = !item.enabled
      this.dispatch(SET_USER, item)
    },
    handle2FA (item) {
      item.secret = ""
      this.dispatch(SET_USER, item)
    },
    fetch () {
      this.$store.dispatch(GET_USERS, {url: this.url})
        .then(items => {
          this.tableFields = [
            { key: "id"},
            { key: "gravatar", label: "", _classes: "text-left" },
            { key: "username", label: "username", _classes: "text-left" },
            { key: "email" },
            { key: "updated" },
            { key: "enabled", label: "enabled", _classes: "text-left" }
          ]
          if (this.isSuperAdmin || this.isAdmin) {
            this.tableFields.push({ key: "roles" })
            this.tableFields.push({ key: "accounts" })
            this.tableFields.push({ key: "controls" })
          }
          this.tableItems = items.map(user => {
            const roles = user.roles.map(roleId => {
              const role = this.roles.find(role => role.id === roleId)
              if (role && role.title) {
                return {label: role.title, value: role.id}
              }
            }).filter(role => !!role)
            const accounts = user.accounts ? user.accounts.map(accountId => {
              const account = this.accounts.find(account => account.id === accountId)
              if (account && account.title) {
                return {label: account.title, value: account.id}
              }
            }).filter(account => !!account) : undefined
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              gravatar: user.gravatar,
              created: user.created,
              updated: moment(user.updated).format("DD/MM/YYYY hh:mm:ss"),
              enabled: user.enabled,
              roles: roles,
              accounts: accounts,
              action: undefined
            }
          })
        })
        .catch(e => {
          console.log(e)
        })
    },
    fetchRoles () {
      this.$store.dispatch(GET_ROLES, {url: this.url})
          .then(roles => {
            if (roles) {
              this.fetch()
              this.$emit("updateRoles", {
                roles: roles
              })
            }
          })
          .catch(e => {
            console.log(e)
          })
    },
    fetchAccounts () {
      this.$store.dispatch(GET_ACCOUNTS, {url: this.url})
          .then(accounts => {
            if (accounts) {
              this.fetch()
              this.$emit("updateAccounts", {
                accounts: accounts
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
<style lang="scss">
  .margin-top-30 {
    margin: 34px 0;
  }
  .edit-relation {
    .btn {
      margin-right: 8px;
    }
  }
  .multiselect {
    margin-bottom: 24px;
    input {
      width: 98%!important;
      display: block;
      height: calc(1.5em + 0.75rem + 2px);
      padding: 0.375rem 0.75rem!important;
      font-size: 0.875rem;
      font-weight: 400;
      line-height: 1.5;
      background-clip: padding-box;
      border: 1px solid;
      color: #768192;
      background-color: #fff;
      border-color: #d8dbe0;
      border-radius: 0.25rem;
      -webkit-transition: border-color 0.15s ease-in-out, -webkit-box-shadow 0.15s ease-in-out;
      transition: border-color 0.15s ease-in-out, -webkit-box-shadow 0.15s ease-in-out;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out, -webkit-box-shadow 0.15s ease-in-out;
    }
    .multiselect__tags-wrap {
      margin-bottom: 10px;
    }
    .multiselect__tag {
      background-color: #636f83;
      color: #ffffff;
      padding: 4px 8px;
      margin-right: 8px;
      border-radius: 8px;
      margin-bottom: 4px;
    }
    .multiselect__content {
      display: inline-block;
      position: absolute;
      top: 74px;
      width: 98%;
      background: #ffffff;
      border-radius: 8px;
      list-style: none;
      padding: 8px 8px;
      z-index: 10;
      li {
        cursor: pointer;
        span {
          padding: 2px 8px;
          display: block;
        }
        &:hover {
          background: #cccccc;
        }
        .multiselect__option--selected {
          font-weight: bold;
          background: #ffffff!important;
        }
      }
    }
  }
</style>