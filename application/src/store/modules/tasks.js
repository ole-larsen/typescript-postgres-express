import {
    GET_TASK,
    GET_TASK_ERROR,
    GET_TASK_SUCCESS,
    GET_TASKS,
    GET_TASKS_ERROR,
    GET_TASKS_SUCCESS,
    REMOVE_TASK,
    SET_TASK,
    SET_TASK_ERROR,
    SET_TASK_SUCCESS
} from "../actions/tasks";

const state = {
    status: undefined,
    hasLoadedOnce: false,
    tasks: []
};

const getters = {
};

const actions = {
    [GET_TASKS]: ({ commit }, { url }) => {
        return new Promise((resolve, reject) => {
            commit(GET_TASKS);
            fetch(`${url}/api/v1/task`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.data && response.data.length > 0) {
                    commit(GET_TASKS_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(GET_TASKS_ERROR, response.message);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [GET_TASK]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(GET_TASK);
            if (item && item.id) {
                fetch(`${url}/api/v1/task/${item.id}`, {
                    method: "GET",
                    headers: {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${state.token}`
                    }
                })
                .then(response => response.json())
                .then(response => {
                    if (response.data) {
                        commit(GET_TASK_SUCCESS, response.data);
                        resolve(response.data);
                    }
                    if (response.message) {
                        commit(GET_TASK_ERROR, response.message);
                        reject(response);
                    }
                })
                .catch(e => {
                    reject(e);
                });
            }
        });
    },
    [SET_TASK]: ({ commit }, { url, item, xls }) => {
        return new Promise((resolve, reject) => {
            commit(SET_TASK);
            fetch(`${url}/api/v1/task`, {
                method: item.id && xls === false ? "PATCH" : "POST",
                body: JSON.stringify(item),
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.data) {
                    commit(SET_TASK_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(SET_TASK_ERROR, response.error);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
    [REMOVE_TASK]: ({ commit }, { url, item }) => {
        return new Promise((resolve, reject) => {
            commit(REMOVE_TASK);
            fetch(`${url}/api/v1/task`, {
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
                    commit(SET_TASK_SUCCESS, response.data);
                    resolve(response.data);
                }
                if (response.message) {
                    commit(SET_TASK_ERROR, response.message);
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
    [GET_TASKS]: (state) => {
        state.status = "loading";
    },
    [GET_TASK]: (state) => {
        state.status = "loading";
    },
    [REMOVE_TASK]: (state) => {
        state.status = "loading";
    },
    [GET_TASKS_SUCCESS]: (state, tasks) => {
        state.status = "tasks success";
        state.hasLoadedOnce = true;
        state.tasks = tasks;
    },
    [GET_TASKS_ERROR]: (state, error) => {
        state.status = "tasks error";
        state.hasLoadedOnce = true;
        state.tasks = [];
    },
    [SET_TASK]: (state) => {
        state.status = "loading";
    },
    [GET_TASK_SUCCESS]: (state) => {
        state.status = "task success";
        state.hasLoadedOnce = true;
    },
    [GET_TASK_ERROR]: (state, error) => {
        state.status = "task error";
        state.hasLoadedOnce = true;
    },
    [SET_TASK_SUCCESS]: (state) => {
        state.status = "task success";
        state.hasLoadedOnce = true;
    },
    [SET_TASK_ERROR]: (state, error) => {
        state.status = "task error";
        state.hasLoadedOnce = true;
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};
