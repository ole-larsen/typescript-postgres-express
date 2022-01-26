import backend from '@/mixins/backend'
import {mapState} from "vuex";
import {ADMIN_ROLE_ID, SUPERADMIN_ROLE_ID, USER_ROLE_ID} from "../main";

export default {
  mixins: [backend],
  computed: {
    isSuperAdmin () {
      return this.currentUser.roles.includes(SUPERADMIN_ROLE_ID)
    },
    isAdmin () {
      return this.currentUser.roles.includes(ADMIN_ROLE_ID)
    },
    isUser () {
      return this.currentUser.roles.includes(USER_ROLE_ID)
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
