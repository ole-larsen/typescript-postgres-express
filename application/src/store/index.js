import Vue from "vue";
import Vuex from "vuex";
import auth from "./modules/auth";
import service from "./modules/service";
import sidebar from "./modules/sidebar";
import users from "./modules/users";
import roles from "./modules/roles";
import accounts from "./modules/accounts";
import scheduler from "./modules/tasks";
import timeSeries from "./modules/timeSeries";

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== "production";

export default new Vuex.Store({
  modules: {
    auth,
    sidebar,
    service,
    users,
    roles,
    accounts,
    scheduler,
    timeSeries,
  },
  strict: debug
});
