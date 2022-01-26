import {
  AUTH_SIGNUP,
  AUTH_SIGNIN,
  AUTH_ERROR,
  AUTH_SUCCESS,
  AUTH_LOGOUT,
  AUTH_VALIDATE,
  AUTH_VALIDATED,
  USER_2FA_ERROR,
  USER_2FA_REQUEST,
  USER_2FA_SUCCESS, USER_FORGOT, USER_FORGOT_ERROR, USER_RESET, USER_RESET_ERROR
} from '../actions/auth'

const state = {
  user: localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : undefined,
  token: localStorage.getItem('access_token') || undefined,
  status: undefined,
}

const getters = {
  isAuthenticated: state => !!state.token,
  getStatus: state => state.status,
  isAuthorized: state => !!state.user,
}

const actions = {
  [AUTH_SIGNUP]: ({ commit }, {user, url}) => {
    return new Promise((resolve, reject) => {
      commit(AUTH_SIGNUP)
      fetch(`${url}/api/v1/auth/signup`, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(r => r.json())
      .then(r => {
        if (r.user) {
          commit(AUTH_SUCCESS, r.user)
          resolve(r)
        }
        if (r.message) {
          commit(AUTH_ERROR, r.message)
          reject(r)
        }
      })
      .catch(e => {
        reject(e)
      })
    })
  },
  [AUTH_SIGNIN]: ({ commit }, {user, url}) => {
    return new Promise((resolve, reject) => {
      commit(AUTH_SIGNIN)
      fetch(`${url}/api/v1/auth/signin`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(r => r.json())
      .then(r => {
        if (r.user) {
          commit(AUTH_SUCCESS, r.user)
          resolve(r)
        }
        if (r.message) {
          commit(AUTH_ERROR, r.error)
          reject(r)
        }
      })
      .catch(e => {
        reject(e)
      })
    })
  },
  [USER_FORGOT]: ({ commit }, { user, url}) => {
    commit(USER_FORGOT)
    return new Promise((resolve, reject) => {
      fetch(`${url}/api/v1/auth/forgot-password`, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json'
        }
        })
        .then(r => r.json())
        .then(r => {
          if (r.message) {
            commit(USER_FORGOT_ERROR)
            reject(r)
          }
          if (r.token) {
            resolve(r)
          }
        })
        .catch(error => {
          commit(USER_FORGOT_ERROR)
          reject(error)
        })
    })
  },
  [USER_RESET]: ({ commit }, { token, url, user}) => {
    commit(USER_RESET)
    return new Promise((resolve, reject) => {
      fetch(`${url}/api/v1/auth/reset/${token}`, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(r => r.json())
      .then(r => {
        if (r.message) {
          commit(USER_RESET_ERROR)
          reject(r)
        }
        if (r.user) {
          resolve(r)
        }
      })
      .catch(error => {
        commit(USER_RESET_ERROR)
        reject(error)
      })
    })
  },
  [AUTH_VALIDATE]: ({ commit }, url) => {
    // run mutation
    commit(AUTH_VALIDATE)
    return new Promise((resolve, reject) => {
      try {
        fetch(`${url}/api/v1/auth/check`, {
          method: 'POST', // or 'PUT'
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          }
        })
        .then(r => {
          if (r && r.status !== 200) {
            return r.text()
          }
          return r.json()
        })
        .then(r => {
          if (r.user && r.user.token) {
            localStorage.setItem('access_token', r.user.token)
            commit(AUTH_VALIDATED)
            return resolve(r)
          }
          if (r.error === true || typeof r === 'string') {
            commit(AUTH_ERROR, r)
            return reject(r)
          }
        })
        .catch(e => {
          console.log(e);
        })
      } catch (e) {
        console.log('error from vuex', e)
        commit(AUTH_ERROR)
        reject(e)
      }
    })
  },
  [AUTH_LOGOUT]: ({ commit }, {user, url}) => {
    commit(AUTH_LOGOUT)
    return new Promise((resolve, reject) => {
      fetch(`//${url}/api/v1/auth/logout`, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        }
      })
      .then(r => r.json())
      .then(r => {
        if (r.user) {
           resolve(r)
        } else {
          reject(r)
        }
      })
      .catch(error => {
        commit(USER_2FA_ERROR)
        reject(error)
      })
    })
  },
  [USER_2FA_REQUEST]: ({ commit }, { user, url}) => {
    commit(USER_2FA_REQUEST)
    return new Promise((resolve, reject) => {
      fetch(`${url}/api/v1/auth/2fa`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(r => r.json())
      .then(r => {
        if (r.data) {
          localStorage.setItem('access_token', r.data['access_token'])
          commit(USER_2FA_SUCCESS, r.data['access_token'])
          resolve(r.data)
        }
        if (r.message) {
          commit(USER_2FA_ERROR)
          reject(r)
        }
      })
      .catch(error => {
        commit(USER_2FA_ERROR)
        reject(error)
      })
    })
    // if resp is unauthorized, logout, to
    // dispatch(AUTH_LOGOUT)
  }
}

const mutations = {
  [AUTH_SIGNUP]: (state) => {
    state.status = 'signup'
  },
  [AUTH_SIGNIN]: (state) => {
    state.status = 'loading'
  },
  [AUTH_SUCCESS]: (state, user) => {
    localStorage.setItem('user', JSON.stringify(user))
    state.status = 'auth success'
    state.hasLoadedOnce = true
    state.user = user
  },
  [AUTH_VALIDATE]: (state) => {
    state.status = 'validate'
    state.hasLoadedOnce = true
    console.log('status:', state.status)
  },
  [AUTH_VALIDATED]: (state) => {
    state.status = 'validated successfully'
    state.hasLoadedOnce = true
    console.log('status:', state.status)
  },
  [AUTH_ERROR]: (state, payload) => {
    if (payload) {
      state.status = payload.replace('\n', '')
    }
    state.hasLoadedOnce = true
    state.token = undefined
    state.user = undefined
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },
  [AUTH_LOGOUT]: state => {
    state.token = undefined
    state.user = undefined
  },
  [USER_FORGOT]: state => {
    state.status = 'loading'
  },
  [USER_RESET]: (state) => {
    state.status = 'loading'
  },
  [USER_2FA_REQUEST]: state => {
    state.status = 'loading'
  },
  [USER_2FA_SUCCESS]: (state, token) => {
    if (token) {
      state.status = 'success'
      state.token = token
    }
  },
  [USER_2FA_ERROR]: state => {
    state.status = 'error'
  },
  [USER_FORGOT_ERROR]: state => {
    state.status = 'error'
  },
  [USER_RESET_ERROR]: state => {
    state.status = 'error'
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
