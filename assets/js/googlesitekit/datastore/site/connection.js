/**
 * core/site data store: connection info.
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
const FETCH_CONNECTION = 'FETCH_CONNECTION';
const RECEIVE_CONNECTION = 'RECEIVE_CONNECTION';
const RECEIVE_CONNECTION_FAILED = 'RECEIVE_CONNECTION_FAILED';

export const INITIAL_STATE = {
	connection: null,
	isFetchingConnection: false,
};

export const actions = {
	fetchConnection() {
		return {
			payload: {},
			type: FETCH_CONNECTION,
		};
	},

	receiveConnection( connection ) {
		invariant( connection, 'connection is required.' );

		return {
			payload: { connection },
			type: RECEIVE_CONNECTION,
		};
	},

	receiveConnectionFailed() {
		return {
			payload: {},
			type: RECEIVE_CONNECTION_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_CONNECTION ]: () => {
		return API.get( 'core', 'site', 'connection' );
	},
};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
		case FETCH_CONNECTION: {
			return {
				...state,
				isFetchingConnection: true,
			};
		}

		case RECEIVE_CONNECTION: {
			const { connection } = action.payload;

			return {
				...state,
				isFetchingConnection: false,
				connection,
			};
		}

		case RECEIVE_CONNECTION_FAILED: {
			return {
				...state,
				isFetchingConnection: false,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getConnection() {
		try {
			const connection = yield actions.fetchConnection();
			return actions.receiveConnection( connection );
		} catch ( err ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveConnectionFailed();
		}
	},
};

export const selectors = {
	getConnection( state ) {
		const { connection } = state;

		return connection;
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
