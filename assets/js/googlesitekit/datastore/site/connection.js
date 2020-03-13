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
	connection: undefined,
	isFetchingConnection: false,
};

export const actions = {
	/**
	 * Dispatches an action that creates an HTTP request.
	 *
	 * Requests the `core/site/connection` endpoint.
	 *
	 * @since 1.5.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	fetchConnection() {
		return {
			payload: {},
			type: FETCH_CONNECTION,
		};
	},

	/**
	 * Stores connection info received from the REST API.
	 *
	 * @since 1.5.0
	 * @private
	 *
	 * @param {Object} connection Connection info from the API.
	 * @return {Object} Redux-style action.
	 */
	receiveConnection( connection ) {
		invariant( connection, 'connection is required.' );

		return {
			payload: { connection },
			type: RECEIVE_CONNECTION,
		};
	},

	/**
	 * Dispatches an action signifying the `fetchConnection` side-effect failed.
	 *
	 * @since 1.5.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
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
	/**
	 * Gets the connection info for this site.
	 *
	 * Returns `null` if the connection info is not available/loaded.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 *   connected: <Boolean>,
	 *   resettable: <Boolean,
	 * }
	 * ```
	 *
	 * @since 1.5.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|null} Site connection info.
	 */
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
