/**
 * core/user Data store: disconnect
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
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';

// Actions
const START_FETCH_DISCONNECT = 'START_FETCH_DISCONNECT';
const FETCH_DISCONNECT = 'FETCH_DISCONNECT';
const FINISH_FETCH_DISCONNECT = 'FINISH_FETCH_DISCONNECT';
const CATCH_FETCH_DISCONNECT = 'CATCH_FETCH_DISCONNECT';
const RECEIVE_DISCONNECT = 'RECEIVE_DISCONNECT';

export const INITIAL_STATE = {
	isFetchingDisconnect: false,
	disconnected: undefined,
};

export const actions = {
	*disconnect() {
		let response, error;
		yield {
			payload: {},
			type: START_FETCH_DISCONNECT,
		};

		try {
			response = yield {
				payload: {},
				type: FETCH_DISCONNECT,
			};

			yield actions.receiveDisconnected( response );

			yield {
				payload: {},
				type: FINISH_FETCH_DISCONNECT,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: { error },
				type: CATCH_FETCH_DISCONNECT,
			};
		}
		return { response, error };
	},

	/**
	 * Stores the disconnection info received from the REST API.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} disconnected Disconnection response from the API.
	 * @return {Object} Redux-style action.
	 */
	receiveDisconnected( disconnected ) {
		invariant( disconnected !== undefined, 'disconnect is required.' );

		return {
			payload: { disconnected },
			type: RECEIVE_DISCONNECT,
		};
	},
};

export const controls = {
	[ FETCH_DISCONNECT ]: () => {
		return API.set( 'core', 'user', 'disconnect' );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_DISCONNECT: {
			return {
				...state,
				isFetchingDisconnect: true,
			};
		}

		case RECEIVE_DISCONNECT: {
			const { disconnected } = payload;

			return {
				...state,
				disconnected,
			};
		}

		case FINISH_FETCH_DISCONNECT: {
			return {
				...state,
				isFetchingDisconnect: false,
			};
		}

		case CATCH_FETCH_DISCONNECT: {
			return {
				...state,
				error: payload.error,
				isFetchingDisconnect: false,
			};
		}
		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};
export const selectors = {
	/**
	 * Returns whether a disconnect is occuring.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Is a disconnect ocurring or not.
	 */
	isDoingDisconnect( state ) {
		const { isFetchingDisconnect } = state;
		return isFetchingDisconnect;
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
