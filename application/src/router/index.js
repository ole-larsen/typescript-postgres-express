import Vue from "vue";
import Router from "vue-router";
import store from "@/store";
import adminRoutes from "@/router/adminRoutes";
import serviceRoutes from "@/router/serviceRoutes";
import {AUTH_VALIDATE} from "../store/actions/auth";
import backend from "../mixins/backend";

// Containers
const TheContainer = () => import("@/containers/TheContainer");

// Views
// const Dashboard = () => import("@/views/Dashboard")

// Views - AUTH
const Login = () => import("@/views/auth/Login");
const GA2FA = () => import("@/views/auth/Ga2fa");
const Logout = () => import("@/views/auth/Logout");
const Register = () => import("@/views/auth/Register");
const Forgot = () => import("@/views/auth/Forgot");
const Reset = () => import("@/views/auth/Reset");
const Page404 = () => import("@/views/pages/Page404");
const Page500 = () => import("@/views/pages/Page500");

Vue.use(Router);

const router = new Router({
  mode: "history", // https://router.vuejs.org/api/#mode
  linkActiveClass: "active",
  scrollBehavior: () => ({ y: 0 }),
  routes: configRoutes()
});
router.beforeEach((to, from, next) => {
  const authorized = !!localStorage.getItem("user");
  const authenticated = !!localStorage.getItem("access_token");

  if (!authorized || (!authorized && !authenticated)) {
    if (to.meta.requiredAuth) {
      next("/auth/login");
    } else {
      next();
    }
  }
  if (authorized && !authenticated) {
    if (to.meta.requiredAuth && to.name === "2fa") {
      next();
    } else {
      next("/auth/2fa");
    }
  }
  if (authorized && authenticated) {
    store.dispatch(AUTH_VALIDATE, backend.data().url).then(() => {
      if (!localStorage.getItem("access_token")) {
        next("/auth/login");
      } else {
        next();
      }
    }).catch(e => {
       console.log(e);
       next("/auth/login");
    });
  }
  next();
});

function configRoutes () {
  return [
    {
      path: "/",
      redirect: "/dashboard",
      name: "Home",
      component: TheContainer,
      children: [
        {
          path: "dashboard",
          name: "Dashboard",
          component: {
            render (c) { return c("router-view"); }
          },
          meta: {
            requiredAuth: true,
            access: ["manager", "user", "admin", "superadmin"]
          },
          children: serviceRoutes
        }
      ]
    },
    {
      path: "/auth",
      redirect: "/pages/404",
      name: "Auth",
      component: {
        render (c) { return c("router-view") }
      },
      children: [
        {
          path: "login",
          name: "Login",
          component: Login,
          meta: {
            requiredAuth: false
          }
        },
        {
          path: "2fa",
          name: "2fa",
          component: GA2FA,
          meta: {
            requiredAuth: true,
            access: ["manager", "user", "admin", "superadmin"]
          }
        },
        {
          path: "logout",
          name: "Logout",
          component: Logout,
          meta: {
            requiredAuth: true
          }
        },
        {
          path: "signup",
          name: "Signup",
          component: Register,
          meta: {
            requiredAuth: false
          }
        },
        {
          path: "forgot-password",
          name: "Forgot",
          component: Forgot,
          meta: {
            requiredAuth: false
          }
        },
        {
          path: "reset-password/:token",
          name: "Reset",
          component: Reset,
          meta: {
            requiredAuth: false
          }
        }
      ]
    },
    {
      path: "/pages",
      redirect: "/pages/404",
      name: "Pages",
      component: {
        render (c) { return c("router-view"); }
      },
      children: [
        {
          path: "404",
          name: "Page404",
          component: Page404
        },
        {
          path: "500",
          name: "Page500",
          component: Page500
        }
      ]
    },
    {
      path: "/admin",
      redirect: "/pages/404",
      name: "Admin",
      component: TheContainer,
      children: adminRoutes
    },
    { path: "*", component: Page404 }
  ];
}

export default router;
