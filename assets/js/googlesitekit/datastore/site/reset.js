/**
 * core/site data store: reset connection.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { initializeAction } from 'assets/js/googlesitekit/data/utils';

// Actions
const FETCH_RESET = 'FETCH_RESET';
const RECEIVE_RESET = 'RECEIVE_RESET';
const RECEIVE_RESET_FAILURE = 'RECEIVE_RESET_FAILURE';

export const INITIAL_STATE = {
	isFetchingReset: false,
};

export const actions = {
	/**
	 * Dispatches an action that creates an HTTP request.
	 *
	 * Requests the `core/site/reset` endpoint.
	 *
	 * @since 1.5.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	fetchReset() {
		return {
			payload: {},
			type: FETCH_RESET,
		};
	},

	/**
	 * Dispatches that reset confirmation was received from the REST API.
	 *
	 * @since 1.5.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	receiveReset() {
		return {
			payload: {},
			type: RECEIVE_RESET,
		};
	},

	/**
	 * Dispatches an action signifying the `fetchReset` side-effect failed.
	 *
	 * @since 1.5.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	receiveResetFailed() {
		return {
			payload: {},
			type: RECEIVE_RESET_FAILURE,
		};
	},

	/**
	 * Resets the website's connection info to Site Kit.
	 *
	 * WARNING: This causes the website's connection with Google Site Kit to be
	 * removed and will require re-authentication. Use this action with caution,
	 * and always request user confirmation before dispatching.
	 *
	 * @since 1.5.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*reset() {
		try {
			yield actions.fetchReset();
			yield actions.receiveReset();
			return initializeAction();
		} catch ( err ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveResetFailed();
		}
	},
};

export const controls = {
	[ FETCH_RESET ]: () => {
		return API.set( 'core', 'site', 'reset' );
	},
};

export const reducer = ( state, { type } ) => {
	switch ( type ) {
		case FETCH_RESET: {
			return {
				...state,
				isFetchingReset: true,
			};
		}

		case RECEIVE_RESET_FAILURE: {
			return {
				...state,
				isFetchingReset: false,
			};
		}

		case RECEIVE_RESET: {
			return { ...INITIAL_STATE };
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Checks if reset action is in-process.
	 *
	 * @since 1.5.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if resetting is in-flight; `false` if not.
	 */
	isDoingReset: ( state ) => {
		const { isFetchingReset } = state;

		return isFetchingReset;
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
