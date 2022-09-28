import {
    GET_USER,
    GET_USERS,
    GET_USERS_ERROR,
    GET_USERS_SUCCESS,
    REMOVE_USER,
    SET_USER,
    SET_USER_ERROR,
    SET_USER_SUCCESS
} from "../actions/users";

const state = {
    user: undefined,
    token: localStorage.getItem("access_token") || undefined,
    status: undefined,
    hasLoadedOnce: false,
    users: []
};

const getters = {};

const actions = {
    [GET_USERS]: ({ commit }, {url}) => {
        return new Promise((resolve, reject) => {
            commit(GET_USERS);
            fetch(`${url}/api/v1/user`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.data && response.data.length > 0) {
                    commit(GET_USERS_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(GET_USERS_ERROR, response.message);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [GET_USER]: ({ commit }, {url, item}) => {
        return new Promise((resolve, reject) => {
            commit(GET_USER);
            if (item && item.id) {
                fetch(`${url}/api/v1/user/${item.id}`, {
                    method: "GET",
                    headers: {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${state.token}`
                    }
                })
                .then(response => response.json())
                .then(response => {
                    if (response.data) {
                        commit(SET_USER_SUCCESS, response.data);
                        resolve(response.data);
                    }
                    if (response.message) {
                        commit(SET_USER_ERROR, response.message);
                        reject(response);
                    }
                })
                .catch(e => {
                    reject(e);
                });
            }
        });
    },
    [SET_USER]: ({ commit }, { url, item }) => {
        if (item.accounts) {
            item.accounts = item.accounts.map(account => {
                if (account.value) {
                    return account.value;
                }
                return account;
            });
        }
        if (item.roles) {
            item.roles = item.roles.map(role => {
                if (role.value) {
                    return role.value;
                }
                return role;
            });
        }

        return new Promise((resolve, reject) => {
            commit(SET_USER);
            fetch(`${url}/api/v1/user`, {
                method: item.id ? "PATCH" : "POST",
                body: JSON.stringify(item),
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.data) {
                    commit(SET_USER_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(SET_USER_ERROR, response.message);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [REMOVE_USER]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(REMOVE_USER);
            fetch(`${url}/api/v1/user`, {
                method: "DELETE",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                },
                body: JSON.stringify(item)
            })
                .then(response => response.json())
                .then(response => {
                    if (response.data) {
                        commit(SET_USER_SUCCESS, response.data);
                        resolve(response.data);
                    }
                    if (response.message) {
                        commit(SET_USER_ERROR, response.message);
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
    [GET_USERS]: (state) => {
        state.status = "loading";
    },
    [GET_USER]: (state) => {
        state.status = "loading";
    },
    [REMOVE_USER]: (state) => {
        state.status = "loading";
    },
    [SET_USER]: (state) => {
        state.status = "loading";
    },
    [GET_USERS_SUCCESS]: (state, users) => {
        state.status = "response success";
        state.hasLoadedOnce = true;
        state.users = users;
    },
    [GET_USERS_ERROR]: (state) => {
        state.status = "response error";
        state.hasLoadedOnce = true;
        state.users = [];
        console.log("status:", state.status);
    },
    [SET_USER_SUCCESS]: (state, user) => {
        state.status = "response success";
        state.hasLoadedOnce = true;
        state.user = user;
    },
    [SET_USER_ERROR]: (state, error) => {
        state.status = "response error";
        state.hasLoadedOnce = true;
        console.log("status:", state.status, error);
        state.user = undefined;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
