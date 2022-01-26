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

        <td slot="roles" slot-scope="{item}" class="edit-relation" v-if="isSuperAdmin || isAdmin">
          <CButtonGroup>
            <template v-for="(role) in item.roles">
              <CButton color="info" size="sm" @click.stop.prevent="editRole(role)">
                {{role.label}}
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
import authMixin from '@/mixins/auth'
import {GET_USER, GET_USERS, REMOVE_USER, SET_USER, SET_USER_ENABLE} from '../../store/actions/users'
import {mapState} from 'vuex'
import {GET_ROLES} from '../../store/actions/roles'
import Multiselect from 'vue-multiselect'

export default {
  name: 'Users',
  mixins: [authMixin],
  components: {
    Multiselect
  },
  props: ['_user', '_users'],
  watch: {
    _users: {
      immediate: true,
      handler () {
        this.fetchUsers()
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
      })
    })
  },
  mounted () {
    if (this.roles.length === 0) {
      this.fetchRoles()
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
        roles: undefined
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
        roles: undefined
      }
      this.darkModal = false
    },
    edit (user) {
      this.dispatch(GET_USER, user)
    },
    editRole (role) {
      this.$emit('editRole', {
        role: this.roles.find(r => r.id === role.value)
      })
    },
    remove (user) {
      this.dispatch(REMOVE_USER, user)
    },
    loadUser(user) {
      user.roles = user.roles
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
      this.itemForUpdate = user
      this.darkModal = true
    },
    dispatch (itemForUpdate, user) {
      this.apiError.message = undefined
      this.$store.dispatch(itemForUpdate, {url: this.url, user: user})
          .then(r => {
            if (r.user) {
              if (itemForUpdate === GET_USER) {
                // copy role to prevent mutations in store
                this.loadUser(JSON.parse(JSON.stringify(r.user)))
              } else if (itemForUpdate === SET_USER) {
                this.reset()
                this.fetchRoles()
              } else if (itemForUpdate === SET_USER_ENABLE){
                this.fetchUsers()
              } else if (itemForUpdate === REMOVE_USER){
                this.fetchRoles()
              } else {
                console.log(itemForUpdate, r.user)
              }
            }
            if (r.users) {
              this.fetchUsers()
            }
            if (r.message) {
              console.log(r)
            }
          })
          .catch(e => {
            this.apiError.message = e.message
            this.fetchUsers()
            setTimeout(() => {
              this.apiError.message = undefined;
            }, 10000);
          })
    },
    handleEnabled (user) {
      user.enabled = !user.enabled
      this.dispatch(SET_USER_ENABLE, user)
    },
    handle2FA (user) {
      user.secret = ""
      this.dispatch(SET_USER, user)
    },
    fetchUsers () {
      this.$store.dispatch(GET_USERS, {url: this.url})
        .then(r => {
          this.tableFields = [
            { key: 'id'},
            { key: 'gravatar', label: '', _classes: 'text-left' },
            { key: 'username', label: 'username', _classes: 'text-left' },
            { key: 'email' },
            { key: 'updated' },
            { key: 'enabled', label: 'enabled', _classes: 'text-left' }
          ]
          if (this.isSuperAdmin || this.isAdmin) {
            this.tableFields.push({ key: 'roles' })
            this.tableFields.push({ key: 'controls' })
          }
          this.tableItems = r.map(user => {
            const roles = user.roles.map(roleId => {
              const role = this.roles.find(role => role.id === roleId)
              if (role && role.title) {
                return {label: role.title, value: role.id}
              }
            }).filter(role => !!role)
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              gravatar: user.gravatar,
              created: user.created,
              updated: user.updated,
              enabled: user.enabled,
              roles: roles,
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
              this.fetchUsers()
              this.$emit('updateRoles', {
                roles: roles
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