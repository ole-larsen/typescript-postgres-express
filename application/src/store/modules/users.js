import {
    GET_USER,
    GET_USERS,
    GET_USERS_ERROR,
    GET_USERS_SUCCESS,
    REMOVE_USER, SET_USER,
    SET_USER_ENABLE,
    SET_USER_ERROR,
    SET_USER_SUCCESS
} from "../actions/users";

const state = {
    user: undefined,
    token: localStorage.getItem('access_token') || undefined,
    status: undefined,
    hasLoadedOnce: false,
    users: []
}

const getters = {
}

const actions = {
    [GET_USERS]: ({ commit }, {url}) => {
        return new Promise((resolve, reject) => {
            commit(GET_USERS)
            fetch(`${url}/api/v1/user`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
            .then(r => r.json())
            .then(r => {
                if (r.length > 0) {
                    commit(GET_USERS_SUCCESS, r)
                    resolve(r)
                }
                if (r.message) {
                    commit(GET_USERS_ERROR, r.message)
                    reject(r)
                }
            })
            .catch(e => {
                reject(e)
            })
        })
    },
    [GET_USER]: ({ commit }, {url, user}) => {
        return new Promise((resolve, reject) => {
            commit(GET_USER)
            if (user && user.id) {
                fetch(`${url}/api/v1/user/${user.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    }
                })
                .then(r => r.json())
                .then(r => {
                    if (r.user) {
                        commit(SET_USER_SUCCESS, r.user)
                        resolve(r)
                    }
                    if (r.message) {
                        commit(SET_USER_ERROR, r.message)
                        reject(r)
                    }
                })
                .catch(e => {
                    reject(e)
                })
            }
        })
    },
    [SET_USER_ENABLE]: ({ commit }, {url, user}) => {
        return new Promise((resolve, reject) => {
            commit(SET_USER_ENABLE)
            if (user.roles && user.roles.length > 0) {
                user.roles = user.roles.map(role => {
                    if (role.id) {
                        return role.id
                    }
                    return role
                })
                user.roles = user.roles.map(role => {
                    if (role.label) {
                        return role.value
                    }
                    return role
                })
            }
            fetch(`${url}/api/v1/user`, {
                method: 'PUT',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
                .then(r => r.json())
                .then(r => {
                    if (r.user) {
                        commit(SET_USER_SUCCESS, r.user)
                        resolve(r)
                    }
                    if (r.message) {
                        commit(SET_USER_ERROR, r.error)
                        reject(r)
                    }
                })
                .catch(e => {
                    console.log(e)
                    reject(e)
                })
        })
    },
    [SET_USER]: ({ commit }, {url, user}) => {
        return new Promise((resolve, reject) => {
            commit(SET_USER)
            fetch(`${url}/api/v1/user`, {
                method: user.id ? 'PUT' : 'POST',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
            .then(r => r.json())
            .then(r => {
                if (r.user) {
                    commit(SET_USER_SUCCESS, r.user)
                    resolve(r)
                }
                if (r.message) {
                    commit(SET_USER_ERROR, r.message)
                    reject(r)
                }
            })
            .catch(e => {
                console.log(e)
                reject(e)
            })
        })
    },
    [REMOVE_USER]: ({ commit }, {url, user}) => {
        return new Promise((resolve, reject) => {
            commit(REMOVE_USER)
            fetch(`${url}/api/v1/user`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(user)
            })
                .then(r => r.json())
                .then(r => {
                    if (r.user) {
                        commit(SET_USER_SUCCESS, r.user)
                        resolve(r)
                    }
                    if (r.message) {
                        commit(SET_USER_ERROR, r.message)
                        reject(r)
                    }
                })
                .catch(e => {
                    reject(e)
                })
        })
    }
}

const mutations = {
    [GET_USERS]: (state) => {
        state.status = 'loading'
    },
    [GET_USER]: (state) => {
        state.status = 'loading'
    },
    [REMOVE_USER]: (state) => {
        state.status = 'loading'
    },
    [SET_USER_ENABLE]: (state) => {
        state.status = 'loading'
    },
    [SET_USER]: (state) => {
        state.status = 'loading'
    },
    [GET_USERS_SUCCESS]: (state, users) => {
        state.status = 'users success'
        state.hasLoadedOnce = true
        state.users = users
    },
    [GET_USERS_ERROR]: (state) => {
        state.status = 'users error'
        state.hasLoadedOnce = true
        state.users = []
        console.log('status:', state.status)
    },
    [SET_USER_SUCCESS]: (state, user) => {
        state.status = 'users success'
        state.hasLoadedOnce = true
        state.user = user
    },
    [SET_USER_ERROR]: (state, error) => {
        state.status = 'users error'
        state.hasLoadedOnce = true
        console.log('status:', state.status, error)
        state.user = undefined
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
