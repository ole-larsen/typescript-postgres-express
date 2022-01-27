<template>
  <div>
    <CRow>
      <CCol md="12">
        <roles @editUser="editUser" @updateUsers="updateUsers" :_role="role" :_roles="roles"></roles>
      </CCol>
    </CRow>
    <CRow>
      <CCol md="12">
        <users @editRole="editRole"
               @editAccount="editAccount"
               @updateRoles="updateRoles"
               @updateAccounts="updateAccounts"
               :_user="user" :_users="users">
        </users>
      </CCol>
    </CRow>
    <CRow>
      <CCol md="12">
        <accounts @editUser="editUser" @updateUsers="updateUsers" :_accounts="accounts" :_account="account"></accounts>
      </CCol>
    </CRow>
  </div>
</template>

<script>

import Roles from "../components/dashboard/Roles";
import Users from "../components/dashboard/Users";
import Accounts from "../components/dashboard/Accounts";

export default {
  name: 'Dashboard',
  data () {
    return {
      user:     undefined,
      role:     undefined,
      account:  undefined,
      users:    undefined,
      roles:    undefined,
      accounts: undefined
    }
  },
  methods: {
    editRole (data) {
      this.role = data.role
    },
    editUser (data) {
      this.user = data.user
    },
    editAccount (data) {
      this.account = data.account
    },
    updateRoles (data) {
      this.roles = data.roles
    },
    updateUsers (data) {
      this.users = data.users
    },
    updateAccounts (data) {
      this.accounts = data.accounts
    }
  },
  components: {
    roles: Roles,
    users: Users,
    accounts: Accounts
  }
}
</script>
