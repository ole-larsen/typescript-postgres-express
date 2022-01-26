import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'
import service from './modules/service'
import sidebar from './modules/sidebar'
import users from './modules/users'
import roles from './modules/roles'
Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    auth,
    sidebar,
    service,
    users,
    roles
  },
  strict: debug
})
