<template>
  <div>
    <CRow>
      <CCol md="12">
        <roles @editUser="editUser" @updateUsers="updateUsers" :_role="role" :_roles="roles"></roles>
      </CCol>
    </CRow>
    <CRow>
      <CCol md="12">
        <users @editRole="editRole" @updateRoles="updateRoles" :_user="user" :_users="users"></users>
      </CCol>
    </CRow>
  </div>
</template>

<script>

import Roles from "../components/dashboard/Roles";
import Users from "../components/dashboard/Users";

export default {
  name: 'Dashboard',
  data () {
    return {
      user: undefined,
      role: undefined,
      users: undefined,
      roles: undefined
    }
  },
  methods: {
    editRole (data) {
      this.role = data.role
    },
    editUser (data) {
      this.user = data.user
    },
    updateRoles (data) {
      this.roles = data.roles
    },
    updateUsers (data) {
      this.users = data.users
    }
  },
  components: {
    roles: Roles,
    users: Users
  }
}
</script>
