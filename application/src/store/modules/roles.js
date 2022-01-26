import {
    GET_ROLE, GET_ROLE_ERROR, GET_ROLE_SUCCESS,
    GET_ROLES,
    GET_ROLES_ERROR,
    GET_ROLES_SUCCESS,
    REMOVE_ROLE, SET_ROLE,
    SET_ROLE_ENABLE,
    SET_ROLE_ERROR,
    SET_ROLE_SUCCESS
} from "../actions/roles";

const state = {
    role: undefined,
    token: localStorage.getItem('access_token') || undefined,
    status: undefined,
    hasLoadedOnce: false,
    roles: []
}

const getters = {
}

const actions = {
    [GET_ROLES]: ({ commit }, {url}) => {
        return new Promise((resolve, reject) => {
            commit(GET_ROLES)
            fetch(`${url}/api/v1/role`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
                .then(r => r.json())
                .then(roles => {
                    if (roles.length > 0) {
                        commit(GET_ROLES_SUCCESS, roles)
                        resolve(roles)
                    }
                    if (roles.message) {
                        commit(GET_ROLES_ERROR, roles.message)
                        reject(roles)
                    }
                })
                .catch(e => {
                    reject(e)
                })
        })
    },
    [GET_ROLE]: ({ commit }, {url, role}) => {
        return new Promise((resolve, reject) => {
            commit(GET_ROLE)
            if (role && role.id) {
                fetch(`${url}/api/v1/role/${role.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    }
                })
                .then(r => r.json())
                .then(r => {
                    if (r.role) {
                        commit(GET_ROLE_SUCCESS, r.role)
                        resolve(r)
                    }
                    if (r.message) {
                        commit(GET_ROLE_ERROR, r.message)
                        reject(r)
                    }
                })
                .catch(e => {
                    reject(e)
                })
            }
        })
    },
    [SET_ROLE_ENABLE]: ({ commit }, {url, role}) => {
        return new Promise((resolve, reject) => {
            commit(SET_ROLE_ENABLE)
            if (role.users) {
                role.users = role.users.map(user => {
                    if (user.id) {
                        return user.id
                    }
                    return user
                })
            }
            if (role.users && role.users.length > 0) {
                role.users = role.users.map(user => {
                    if (user.label) {
                        return user.value
                    }
                    return user
                })
            }
            fetch(`${url}/api/v1/role`, {
                method: 'PUT',
                body: JSON.stringify(role),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
            .then(r => r.json())
            .then(r => {
                if (r.role) {
                    commit(SET_ROLE_SUCCESS, r.role)
                    resolve(r)
                }
                if (r.message) {
                    commit(SET_ROLE_ERROR, r.error)
                    reject(r)
                }
            })
            .catch(e => {
                console.log(e)
                reject(e)
            })
        })
    },
    [SET_ROLE]: ({ commit }, {url, role}) => {
        return new Promise((resolve, reject) => {
            commit(SET_ROLE)
            fetch(`${url}/api/v1/role`, {
                method: role.id ? 'PUT' : 'POST',
                body: JSON.stringify(role),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
                .then(r => r.json())
                .then(r => {
                    if (r.role) {
                        commit(SET_ROLE_SUCCESS, r.role)
                        resolve(r)
                    }
                    if (r.message) {
                        commit(SET_ROLE_ERROR, r.error)
                        reject(r)
                    }
                })
                .catch(e => {
                    console.log(e)
                    reject(e)
                })
        })
    },
    [REMOVE_ROLE]: ({ commit }, {url, role}) => {
        return new Promise((resolve, reject) => {
            commit(REMOVE_ROLE)
            fetch(`${url}/api/v1/role`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(role)
            })
            .then(r => r.json())
            .then(r => {
                if (r.role) {
                    commit(SET_ROLE_SUCCESS, r.role)
                    resolve(r)
                }
                if (r.message) {
                    commit(SET_ROLE_ERROR, r.message)
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
    [GET_ROLES]: (state) => {
        state.status = 'loading'
    },
    [GET_ROLE]: (state) => {
        state.status = 'loading'
    },
    [REMOVE_ROLE]: (state) => {
        state.status = 'loading'
    },
    [GET_ROLES_SUCCESS]: (state, roles) => {
        state.status = 'roles success'
        state.hasLoadedOnce = true
        state.roles = roles
    },
    [GET_ROLES_ERROR]: (state, error) => {
        state.status = 'roles error'
        state.hasLoadedOnce = true
        state.roles = []
        console.log('status:', state.status, error)
    },
    [SET_ROLE]: (state) => {
        state.status = 'loading'
    },
    [SET_ROLE_ENABLE]: (state) => {
        state.status = 'loading'
    },
    [GET_ROLE_SUCCESS]: (state, role) => {
        state.status = 'roles success'
        state.role = role
        state.hasLoadedOnce = true
    },
    [GET_ROLE_ERROR]: (state, error) => {
        state.status = 'roles error'
        state.hasLoadedOnce = true
        console.log('status:', state.status, error)
    },
    [SET_ROLE_SUCCESS]: (state) => {
        state.status = 'roles success'
        state.hasLoadedOnce = true
    },
    [SET_ROLE_ERROR]: (state, error) => {
        state.status = 'roles error'
        state.hasLoadedOnce = true
        console.log('status:', state.status, error)
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
