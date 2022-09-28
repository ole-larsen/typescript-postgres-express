import {
    GET_ACCOUNT,
    GET_ACCOUNT_ERROR,
    GET_ACCOUNT_SUCCESS,
    GET_ACCOUNTS,
    GET_ACCOUNTS_ERROR,
    GET_ACCOUNTS_SUCCESS,
    REMOVE_ACCOUNT, REMOVE_ACCOUNT_ERROR, REMOVE_ACCOUNT_SUCCESS,
    SET_ACCOUNT,
    SET_ACCOUNT_ENABLE,
    SET_ACCOUNT_ERROR,
    SET_ACCOUNT_SUCCESS
} from "../actions/accounts";

const state = {
    status: undefined,
    hasLoadedOnce: false,
    accounts: []
};

const getters = {};

const actions = {
    [GET_ACCOUNTS]: ({ commit }, { url }) => {
        return new Promise((resolve, reject) => {
            commit(GET_ACCOUNTS);
            fetch(`${url}/api/v1/account`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.data && response.data.length > 0) {
                    commit(GET_ACCOUNTS_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(GET_ACCOUNTS_ERROR, response.message);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [GET_ACCOUNT]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(GET_ACCOUNT);
            if (item && item.id) {
                fetch(`${url}/api/v1/account/${item.id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${state.token}`
                    }
                })
                .then(response => response.json())
                .then(response => {
                    if (response.data) {
                        commit(GET_ACCOUNT_SUCCESS, response.data);
                        resolve(response.data);
                    }
                    if (response.message) {
                        commit(GET_ACCOUNT_ERROR, response.message);
                        reject(response);
                    }
                })
                .catch(e => {
                    reject(e);
                });
            }
        });
    },
    [SET_ACCOUNT]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(SET_ACCOUNT);
            // fix for multiselect response and type
            if (item.users) {
                item.users = item.users.map(user => {
                    if (user.id) {
                        return user.id;
                    }
                    return user;
                });
            }
            if (item.type && item.type.label) {
                item.type = item.type.label;
            }
            // end fix for multiselect response and type
            fetch(`${url}/api/v1/account`, {
                method: item.id ? "PATCH" : "POST",
                body: JSON.stringify(item),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.data) {
                    commit(SET_ACCOUNT_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(SET_ACCOUNT_ERROR, response.error);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [REMOVE_ACCOUNT]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(REMOVE_ACCOUNT);
            fetch(`${url}/api/v1/account`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                },
                body: JSON.stringify(item)
            })
            .then(response => response.json())
            .then(response => {
                if (response.data) {
                    commit(REMOVE_ACCOUNT_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(REMOVE_ACCOUNT_ERROR, response.message);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    }
};

const mutations = {
    [GET_ACCOUNTS]: (state) => {
        state.status = "loading";
    },
    [GET_ACCOUNT]: (state) => {
        state.status = "loading";
    },
    [REMOVE_ACCOUNT]: (state) => {
        state.status = "loading";
    },
    [GET_ACCOUNTS_SUCCESS]: (state, accounts) => {
        state.accounts = accounts;
        state.status = "accounts success";
        state.hasLoadedOnce = true;
        state.accounts = accounts;
    },
    [GET_ACCOUNTS_ERROR]: (state, error) => {
        state.status = "accounts error";
        state.hasLoadedOnce = true;
        state.accounts = [];
        console.log("status:", state.status, error);
    },
    [SET_ACCOUNT]: (state) => {
        state.status = "loading";
    },
    [SET_ACCOUNT_ENABLE]: (state) => {
        state.status = "loading";
    },
    [GET_ACCOUNT_SUCCESS]: (state, account) => {
        state.status = "accounts success";
        state.account = account;
        state.hasLoadedOnce = true;
    },
    [GET_ACCOUNT_ERROR]: (state, error) => {
        state.status = "accounts error";
        state.hasLoadedOnce = true;
        console.log("status:", state.status, error);
    },
    [SET_ACCOUNT_SUCCESS]: (state) => {
        state.status = "accounts success";
        state.hasLoadedOnce = true;
    },
    [SET_ACCOUNT_ERROR]: (state, error) => {
        state.status = "accounts error";
        state.hasLoadedOnce = true;
        console.log("status:", state.status, error);
    },
    [REMOVE_ACCOUNT_SUCCESS]: (state) => {
        state.status = "accounts success";
        state.hasLoadedOnce = true;
    },
    [REMOVE_ACCOUNT_ERROR]: (state, error) => {
        state.status = "accounts error";
        state.hasLoadedOnce = true;
        console.log("status:", state.status, error);
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
