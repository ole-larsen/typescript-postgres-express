import {
  AUTH_SIGNUP,
  AUTH_LOGIN,
  AUTH_ERROR,
  AUTH_SUCCESS,
  AUTH_LOGOUT,
  AUTH_VALIDATE,
  AUTH_VALIDATED,
  USER_2FA_ERROR,
  AUTH_2FA_REQUEST,
  USER_2FA_SUCCESS,
  AUTH_FORGOT,
  AUTH_FORGOT_ERROR,
  AUTH_RESET,
  AUTH_RESET_ERROR,
  AUTH_LOGOUT_ERROR
} from "../actions/auth";

const state = {
  user: localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : undefined,
  token: localStorage.getItem("access_token") || undefined,
  status: undefined,
};

const getters = {
  isAuthenticated: state => !!state.token,
  getStatus: state => state.status,
  isAuthorized: state => !!state.user
};

const actions = {
  [AUTH_SIGNUP]: ({ commit }, { user, url }) => {
    return new Promise((resolve, reject) => {
      commit(AUTH_SIGNUP);
      fetch(`${url}/api/v1/auth/signup`, {
        method: "POST", // or "PUT"
        body: JSON.stringify(user),
        headers: {
          "content-type": "application/json"
        }
      })
      .then(response => response.json())
      .then(response => {
        if (response && response.data) {
          commit(AUTH_SUCCESS, response.data);
          resolve(response.data);
        }
        if (response.message) {
          commit(AUTH_ERROR, response.message);
          reject(response);
        }
      })
      .catch(e => {
        reject(e);
      });
    });
  },
  [AUTH_LOGIN]: ({ commit }, { user, url }) => {
    return new Promise((resolve, reject) => {
      commit(AUTH_LOGIN);
      fetch(`${url}/api/v1/auth/login`, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
          "content-type": "application/json"
        }
      })
      .then(response => response.json())
      .then(response => {
        if (response.data) {
          commit(AUTH_SUCCESS, response.data);
          resolve(response.data);
        }
        if (response.message) {
          commit(AUTH_ERROR, response.error);
          reject(response);
        }
      })
      .catch(e => {
        reject(e);
      });
    });
  },
  [AUTH_FORGOT]: ({ commit }, { user, url }) => {
    commit(AUTH_FORGOT);
    return new Promise((resolve, reject) => {
      fetch(`${url}/api/v1/auth/forgot-password`, {
        method: "POST", // or "PUT"
        body: JSON.stringify(user),
        headers: {
          "content-type": "application/json"
        }
        })
        .then(response => response.json())
        .then(response => {
          if (response.message) {
            commit(AUTH_FORGOT_ERROR);
            reject(response);
          }
          if (response.data) {
            resolve(response.data);
          }
        })
        .catch(error => {
          commit(AUTH_FORGOT_ERROR);
          reject(error);
        });
    });
  },
  [AUTH_RESET]: ({ commit }, { token, url, user }) => {
    commit(AUTH_RESET);
    return new Promise((resolve, reject) => {
      fetch(`${url}/api/v1/auth/reset/${token}`, {
        method: "POST", // or "PUT"
        body: JSON.stringify(user),
        headers: {
          "content-type": "application/json"
        }
      })
      .then(response => response.json())
      .then(response => {
        if (response.message) {
          commit(AUTH_RESET_ERROR);
          reject(response);
        }
        if (response.data) {
          resolve(response.data);
        }
      })
      .catch(error => {
        commit(AUTH_RESET_ERROR);
        reject(error);
      });
    });
  },
  [AUTH_VALIDATE]: ({ commit }, url) => {
    // run mutation
    commit(AUTH_VALIDATE);
    return new Promise((resolve, reject) => {
      fetch(`${url}/api/v1/auth/check`, {
        method: "POST", // or "PUT"
        headers: {
          "content-type": "application/json",
          "Authorization": `Bearer ${state.token}`
        }
      })
      .then(response => {
        return response.status !== 200 ? response.text() : response.json();
      })
      .then(response => {
        if (response.data && response.data.token) {
          localStorage.setItem("access_token", response.data.token);
          commit(AUTH_VALIDATED);
          return resolve(response.data);
        }
        if (response.error === true || typeof response === "string") {
          commit(AUTH_ERROR, response);
          return reject(response);
        }
      })
      .catch(e => {
        commit(AUTH_ERROR);
        reject(e);
      });
    });
  },
  [AUTH_LOGOUT]: ({ commit }, { user, url }) => {
    commit(AUTH_LOGOUT);
    return new Promise((resolve, reject) => {
      fetch(`//${url}/api/v1/auth/logout`, {
        method: "POST", // or "PUT"
        body: JSON.stringify(user),
        headers: {
          "content-type": "application/json",
          "Authorization": `Bearer ${state.token}`
        }
      })
      .then(response => response.json())
      .then(response => {
        if (response.data) {
           resolve(response);
        } else {
          reject(response);
        }
      })
      .catch(error => {
        commit(AUTH_LOGOUT_ERROR);
        reject(error);
      });
    });
  },
  [AUTH_2FA_REQUEST]: ({ commit }, { user, url}) => {
    commit(AUTH_2FA_REQUEST);
    return new Promise((resolve, reject) => {
      fetch(`${url}/api/v1/auth/2fa`, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
          "content-type": "application/json"
        }
      })
      .then(response => response.json())
      .then(response => {
        if (response.data) {
          localStorage.setItem("access_token", response.data["access_token"]);
          commit(USER_2FA_SUCCESS, response.data["access_token"]);
          resolve(response.data);
        }
        if (response.message) {
          commit(USER_2FA_ERROR);
          reject(response);
        }
      })
      .catch(error => {
        commit(USER_2FA_ERROR);
        reject(error);
      });
    });
  }
};

const mutations = {
  [AUTH_SIGNUP]: (state) => {
    state.status = "signup";
  },
  [AUTH_LOGIN]: (state) => {
    state.status = "loading";
  },
  [AUTH_SUCCESS]: (state, user) => {
    localStorage.setItem("user", JSON.stringify(user));
    state.status = "auth success";
    state.hasLoadedOnce = true;
    state.user = user;
  },
  [AUTH_VALIDATE]: (state) => {
    state.status = "validate";
    state.hasLoadedOnce = true;
    console.log("status:", state.status);
  },
  [AUTH_VALIDATED]: (state) => {
    state.status = "validated successfully";
    state.hasLoadedOnce = true;
    console.log("status:", state.status);
  },
  [AUTH_ERROR]: (state, payload) => {
    if (payload) {
      state.status = payload.replace("\n", "");
    }
    state.hasLoadedOnce = true;
    state.token = undefined;
    state.user = undefined;
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  },
  [AUTH_LOGOUT]: state => {
    state.token = undefined;
    state.user = undefined;
  },
  [AUTH_FORGOT]: state => {
    state.status = "loading";
  },
  [AUTH_RESET]: (state) => {
    state.status = "loading";
  },
  [AUTH_2FA_REQUEST]: state => {
    state.status = "loading";
  },
  [USER_2FA_SUCCESS]: (state, token) => {
    if (token) {
      state.status = "success";
      state.token = token;
    }
  },
  [USER_2FA_ERROR]: state => {
    state.status = "error";
  },
  [AUTH_FORGOT_ERROR]: state => {
    state.status = "error";
  },
  [AUTH_RESET_ERROR]: state => {
    state.status = "error";
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
