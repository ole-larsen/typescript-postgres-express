<template>
  <router-view></router-view>
</template>

<script>
import authMixin from '@/mixins/auth'
import {GET_ROLES} from './store/actions/roles'
import {GET_USERS} from './store/actions/users'
import {GET_TASKS} from './store/actions/tasks'
import {GET_ACCOUNTS} from './store/actions/accounts'

export default {
  name: 'App',
  mixins: [authMixin],
  mounted () {
    if (localStorage.getItem('access_token')) {
      this.$store.dispatch(GET_ROLES, {url: this.url}).catch(e => console.log(e))
      this.$store.dispatch(GET_USERS, {url: this.url}).catch(e => console.log(e))
      this.$store.dispatch(GET_TASKS, {url: this.url}).catch(e => console.log(e))
      this.$store.dispatch(GET_ACCOUNTS, {url: this.url}).catch(e => console.log(e))
    }
  }
}
</script>

<style lang="scss">
  // Import Main styles for this application
  @import 'assets/scss/style';
  .export-btn {
    padding: 0;
    margin-bottom: 8px;
    border: 1px solid #2eb85c;
    border-radius: 4px;
  }
  .edit-btn {
    padding: 0;
    width: 130px;
    margin-right: 8px;
  }
  .importFile {
    display: block;
    label {
      max-width: 100px;
    }
    .input-group-sm {
      display: none;
    }
  }
</style>
