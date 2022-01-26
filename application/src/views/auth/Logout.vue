<script>
  import backend from '@/mixins/backend'
  export default {
    name: 'Logout',
    mixins: [backend],
    created () {
      if (localStorage.getItem('access_token')) {
        localStorage.removeItem('access_token')
      }
      if (localStorage.getItem('token_type')) {
        localStorage.removeItem('token_type')
      }
      if (localStorage.getItem('user')) {
        localStorage.removeItem('user')
      }
      if (localStorage.getItem('ga2fa')) {
        localStorage.removeItem('ga2fa')
      }
      this.$router.push({name: 'Login'})
    }
  }
</script>
