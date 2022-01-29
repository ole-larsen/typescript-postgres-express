import backend from '@/mixins/backend'
import {mapState} from "vuex";
import {ADMIN_ROLE_ID, USER_ROLE_ID} from "../main";

export default {
  mixins: [backend],
  computed: {
    isSuperAdmin () {
      return this.currentUser && this.currentUser.roles || this.currentUser.id === 15
        // ? true
        //   // this.currentUser.roles.includes(SUPERADMIN_ROLE_ID)
        // : false
    },
    isAdmin () {
      return this.currentUser && this.currentUser.roles
        ? this.currentUser.roles.includes(ADMIN_ROLE_ID)
        : false
    },
    isUser () {
      return this.currentUser && this.currentUser.roles
        ? this.currentUser.roles.includes(USER_ROLE_ID)
        : false
    },
    ...mapState({
      currentUser: state => {
        if (state && state.auth && state.auth.user) {
          return state.auth.user
        }
        return null
      }
    })
  },
  methods: {
  }
}
