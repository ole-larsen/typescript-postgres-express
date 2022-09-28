import {
    GET_ROLE,
    GET_ROLE_ERROR,
    GET_ROLE_SUCCESS,
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
    token: localStorage.getItem("access_token") || undefined,
    status: undefined,
    hasLoadedOnce: false,
    roles: []
};

const getters = {
};

const actions = {
    [GET_ROLES]: ({ commit }, { url }) => {
        return new Promise((resolve, reject) => {
            commit(GET_ROLES);
            fetch(`${url}/api/v1/role`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.data && response.data.length > 0) {
                    commit(GET_ROLES_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(GET_ROLES_ERROR, response.message);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [GET_ROLE]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(GET_ROLE);
            if (item && item.id) {
                fetch(`${url}/api/v1/role/${item.id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${state.token}`
                    }
                })
                .then(response => response.json())
                .then(response => {
                    if (response.data) {
                        commit(GET_ROLE_SUCCESS, response.data);
                        resolve(response.data);
                    }
                    if (response.message) {
                        commit(GET_ROLE_ERROR, response.message);
                        reject(response);
                    }
                })
                .catch(e => {
                    reject(e);
                });
            }
        });
    },
    [SET_ROLE]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(SET_ROLE);
            fetch(`${url}/api/v1/role`, {
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
                    commit(SET_ROLE_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(SET_ROLE_ERROR, response.error);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [REMOVE_ROLE]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(REMOVE_ROLE);
            fetch(`${url}/api/v1/role`, {
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
                    commit(SET_ROLE_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(SET_ROLE_ERROR, response.message);
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
    [GET_ROLES]: (state) => {
        state.status = "loading";
    },
    [GET_ROLE]: (state) => {
        state.status = "loading";
    },
    [REMOVE_ROLE]: (state) => {
        state.status = "loading";
    },
    [GET_ROLES_SUCCESS]: (state, roles) => {
        state.status = "response success";
        state.hasLoadedOnce = true;
        state.roles = roles;
    },
    [GET_ROLES_ERROR]: (state, error) => {
        state.status = "response error";
        state.hasLoadedOnce = true;
        state.roles = [];
        console.log("status:", state.status, error);
    },
    [SET_ROLE]: (state) => {
        state.status = "loading";
    },
    [SET_ROLE_ENABLE]: (state) => {
        state.status = "loading";
    },
    [GET_ROLE_SUCCESS]: (state) => {
        state.status = "response success";
        state.hasLoadedOnce = true;
    },
    [GET_ROLE_ERROR]: (state, error) => {
        state.status = "response error";
        state.hasLoadedOnce = true;
        console.log("status:", state.status, error);
    },
    [SET_ROLE_SUCCESS]: (state) => {
        state.status = "response success";
        state.hasLoadedOnce = true;
    },
    [SET_ROLE_ERROR]: (state, error) => {
        state.status = "response error";
        state.hasLoadedOnce = true;
        console.log("status:", state.status, error);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
