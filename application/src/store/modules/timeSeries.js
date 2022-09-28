import {
    GET_TIMESERIES,
    GET_TIMESERIES_SUCCESS,
    GET_TIMESERIES_ERROR
} from "../actions/timeSeries";

const state = {
    status: undefined,
    hasLoadedOnce: false,
    timesSeries: []
};

const getters = {
};

const actions = {
    [GET_TIMESERIES]: ({ commit }, { url }) => {
        return new Promise((resolve, reject) => {
            commit(GET_TIMESERIES);
            fetch(`${url}/api/v1/timeseries`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.length > 0) {
                    commit(GET_TIMESERIES_SUCCESS, response);
                    resolve(response);
                }
                if (response.message) {
                    commit(GET_TIMESERIES_ERROR, response.message);
                    reject(response);
                }
            })
            .catch(e => {
                reject(e);
            });
        });
    },
};

const mutations = {
    [GET_TIMESERIES]: (state) => {
        state.status = "loading";
    },
    [GET_TIMESERIES_SUCCESS]: (state, timeSeries) => {
        state.status = "timeSeries success";
        state.hasLoadedOnce = true;
        state.timeSeries = timeSeries;
    },
    [GET_TIMESERIES_ERROR]: (state, error) => {
        state.status = "timeSeries error";
        state.hasLoadedOnce = true;
        state.timeSeries = [];
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};
