/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';

// Actions
const FETCH_CONNECTION = 'FETCH_CONNECTION';
const RECEIVE_CONNECTION = 'RECEIVE_CONNECTION';
const RECEIVE_CONNECTION_FAILED = 'RECEIVE_CONNECTION_FAILED';

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

	receiveConnectionFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_CONNECTION_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_CONNECTION ]: () => {
		return get( 'core', 'site', 'connection' );
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
			const { error } = action.payload;

			return {
				...state,
				isFetchingConnection: false,
				connection: { error, hasError: true },
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
			return actions.receiveConnectionFailed( err );
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
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
