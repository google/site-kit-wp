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
const START_DISCONNECT = 'START_DISCONNECT';
const FETCH_DISCONNECT = 'FETCH_DISCONNECT';
const FINISH_DISCONNECT = 'FINISH_DISCONNET';
const CATCH_FETCH_DISCONNECT = 'CATCH_FETCH_DISCONNECT';
const RECEIVE_DISCONNECT = 'RECEIVE_DISCONNECT';

export const INITIAL_STATE = {
	isDisconnecting: false,
};

export const actions = {
	*disconnect() {
		let response, error;
		yield {
			payload: {},
			type: START_DISCONNECT,
		};

		try {
			response = yield {
				payload: {},
				type: FETCH_DISCONNECT,
			};
			yield actions.receiveDisconnect( response );

			yield {
				payload: {},
				type: FINISH_DISCONNECT,
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

	receiveDisconnect( disconnect ) {
		invariant( disconnect, 'disconnect  is required.' );

		return {
			payload: { disconnect },
			type: RECEIVE_DISCONNECT,
		};
	},
};

export const controls = {
	[ FETCH_DISCONNECT ]: () => {
		return API.get( 'core', 'user', 'disconnect' );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_DISCONNECT: {
			return {
				...state,
				isDisconnecting: true,
			};
		}
		case RECEIVE_DISCONNECT: {
			const { disconnect } = payload;

			return {
				...state,
				disconnect,
			};
		}

		case FINISH_DISCONNECT: {
			return {
				...state,
				isDisconnecting: false,
			};
		}

		case CATCH_FETCH_DISCONNECT: {
			return {
				...state,
				error: payload.error,
				isDisconnecting: false,
			};
		}
		default: {
			return { ...state };
		}
	}
};

export const selectors = {};

export const resolvers = {};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
