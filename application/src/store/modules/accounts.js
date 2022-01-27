import {
    GET_ACCOUNT,
    GET_ACCOUNT_ERROR,
    GET_ACCOUNT_SUCCESS,
    GET_ACCOUNTS,
    GET_ACCOUNTS_ERROR,
    GET_ACCOUNTS_SUCCESS,
    REMOVE_ACCOUNT,
    SET_ACCOUNT,
    SET_ACCOUNT_ENABLE,
    SET_ACCOUNT_ERROR,
    SET_ACCOUNT_SUCCESS
} from "../actions/accounts";

const state = {
    account: undefined,
    token: localStorage.getItem('access_token') || undefined,
    status: undefined,
    hasLoadedOnce: false,
    accounts: []
}

const getters = {
}

const actions = {
    [GET_ACCOUNTS]: ({ commit }, {url}) => {
        return new Promise((resolve, reject) => {
            commit(GET_ACCOUNTS)
            fetch(`${url}/api/v1/account`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
                .then(r => r.json())
                .then(accounts => {
                    if (accounts.length > 0) {
                        commit(GET_ACCOUNTS_SUCCESS, accounts)
                        resolve(accounts)
                    }
                    if (accounts.message) {
                        commit(GET_ACCOUNTS_ERROR, accounts.message)
                        reject(accounts)
                    }
                })
                .catch(e => {
                    reject(e)
                })
        })
    },
    [GET_ACCOUNT]: ({ commit }, {url, account}) => {
        return new Promise((resolve, reject) => {
            commit(GET_ACCOUNT)
            if (account && account.id) {
                fetch(`${url}/api/v1/account/${account.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    }
                })
                .then(r => r.json())
                .then(r => {
                    if (r.account) {
                        // end fix for multiselect users and type
                        commit(GET_ACCOUNT_SUCCESS, r.account)
                        resolve(r)
                    }
                    if (r.message) {
                        commit(GET_ACCOUNT_ERROR, r.message)
                        reject(r)
                    }
                })
                .catch(e => {
                    reject(e)
                })
            }
        })
    },
    [SET_ACCOUNT_ENABLE]: ({ commit }, {url, account}) => {
        return new Promise((resolve, reject) => {
            commit(SET_ACCOUNT_ENABLE)
            if (account.users) {
                account.users = account.users.map(user => {
                    if (user.id) {
                        return user.id
                    }
                    return user
                })
            }
            if (account.type && account.type.label) {
                account.type = account.type.label
            }
            fetch(`${url}/api/v1/account`, {
                method: 'PUT',
                body: JSON.stringify(account),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
            .then(r => r.json())
            .then(r => {
                if (r.account) {
                    commit(SET_ACCOUNT_SUCCESS, r.account)
                    resolve(r)
                }
                if (r.message) {
                    commit(SET_ACCOUNT_ERROR, r.error)
                    reject(r)
                }
            })
            .catch(e => {
                console.log(e)
                reject(e)
            })
        })
    },
    [SET_ACCOUNT]: ({ commit }, {url, account}) => {
        return new Promise((resolve, reject) => {
            commit(SET_ACCOUNT)
            // fix for multiselect users and type
            if (account.users) {
                account.users = account.users.map(user => {
                    if (user.id) {
                        return user.id
                    }
                    return user
                })
            }
            if (account.type && account.type.label) {
                account.type = account.type.label
            }
            // end fix for multiselect users and type
            fetch(`${url}/api/v1/account`, {
                method: account.id ? 'PUT' : 'POST',
                body: JSON.stringify(account),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                }
            })
                .then(r => r.json())
                .then(r => {
                    if (r.account) {
                        commit(SET_ACCOUNT_SUCCESS, r.account)
                        resolve(r)
                    }
                    if (r.message) {
                        commit(SET_ACCOUNT_ERROR, r.error)
                        reject(r)
                    }
                })
                .catch(e => {
                    console.log(e)
                    reject(e)
                })
        })
    },
    [REMOVE_ACCOUNT]: ({ commit }, {url, account}) => {
        return new Promise((resolve, reject) => {
            commit(REMOVE_ACCOUNT)
            fetch(`${url}/api/v1/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(account)
            })
            .then(r => r.json())
            .then(r => {
                if (r.account) {
                    commit(SET_ACCOUNT_SUCCESS, r.account)
                    resolve(r)
                }
                if (r.message) {
                    commit(SET_ACCOUNT_ERROR, r.message)
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
    [GET_ACCOUNTS]: (state) => {
        state.status = 'loading'
    },
    [GET_ACCOUNT]: (state) => {
        state.status = 'loading'
    },
    [REMOVE_ACCOUNT]: (state) => {
        state.status = 'loading'
    },
    [GET_ACCOUNTS_SUCCESS]: (state, accounts) => {
        state.accounts = accounts
        state.status = 'accounts success'
        state.hasLoadedOnce = true
        state.accounts = accounts
    },
    [GET_ACCOUNTS_ERROR]: (state, error) => {
        state.status = 'accounts error'
        state.hasLoadedOnce = true
        state.accounts = []
        console.log('status:', state.status, error)
    },
    [SET_ACCOUNT]: (state) => {
        state.status = 'loading'
    },
    [SET_ACCOUNT_ENABLE]: (state) => {
        state.status = 'loading'
    },
    [GET_ACCOUNT_SUCCESS]: (state, account) => {
        state.status = 'accounts success'
        state.account = account
        state.hasLoadedOnce = true
    },
    [GET_ACCOUNT_ERROR]: (state, error) => {
        state.status = 'accounts error'
        state.hasLoadedOnce = true
        console.log('status:', state.status, error)
    },
    [SET_ACCOUNT_SUCCESS]: (state) => {
        state.status = 'accounts success'
        state.hasLoadedOnce = true
    },
    [SET_ACCOUNT_ERROR]: (state, error) => {
        state.status = 'accounts error'
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
