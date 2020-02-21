/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	FETCH_CONNECTION_INFO,
	FETCH_RESET,
	INITIALIZE,
	RESET,
	RESET_FAILURE,
	RESET_SUCCESS,
	RECEIVE_CONNECTION_INFO,
	RECEIVE_CONNECTION_INFO_FAILED,
} from './index.private';

export const INITIAL_STATE = {
	connectionInfo: null,
	isFetchingConnectionInfo: false,
	isResetting: false,
};

export const STORE_NAME = 'core/site';

export const actions = {
	fetchConnectionInfo() {
		return {
			payload: {},
			type: FETCH_CONNECTION_INFO,
		};
	},

	fetchReset() {
		return {
			payload: {},
			type: FETCH_RESET,
		};
	},

	initialize() {
		return {
			payload: {},
			type: INITIALIZE,
		};
	},

	receiveConnectionInfo( connectionInfo ) {
		invariant( connectionInfo, 'connectionInfo is required.' );

		return {
			payload: { connectionInfo },
			type: RECEIVE_CONNECTION_INFO,
		};
	},

	receiveConnectionInfoFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_CONNECTION_INFO_FAILED,
		};
	},

	*reset() {
		try {
			yield actions.fetchReset();
			yield actions.resetSuccess();
			yield actions.initialize();

			return {
				payload: {},
				type: RESET,
			};
		} catch ( err ) {
			return actions.resetFailure( err );
		}
	},

	resetFailure( error ) {
		invariant( error, 'error is required.' );
		return {
			payload: { error },
			type: RESET_FAILURE,
		};
	},

	resetSuccess() {
		return {
			payload: {},
			type: RESET_SUCCESS,
		};
	},
};

export const reducer = ( state = INITIAL_STATE, action = {} ) => {
	switch ( action.type ) {
		case FETCH_CONNECTION_INFO: {
			return {
				...state,
				isFetchingConnectionInfo: true,
			};
		}

		case FETCH_RESET: {
			return {
				...state,
				isResetting: true,
			};
		}

		case INITIALIZE: {
			return { ...INITIAL_STATE };
		}

		case RECEIVE_CONNECTION_INFO: {
			const { connectionInfo } = action.payload;

			return {
				...state,
				isFetchingConnectionInfo: false,
				connectionInfo,
			};
		}

		case RECEIVE_CONNECTION_INFO_FAILED: {
			const { error } = action.payload;

			return {
				...state,
				isFetchingConnectionInfo: false,
				connectionInfo: { error, hasError: true },
			};
		}

		case RESET_FAILURE: {
			const { error } = action.payload;
			return {
				...state,
				resetError: error,
				isResetting: false,
			};
		}

		case RESET_SUCCESS: {
			return {
				...state,
				isResetting: false,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const selectors = {
	getConnection: ( state ) => {
		const { connectionInfo } = state;

		return connectionInfo;
	},

	isFetchingConnectionInfo: ( state ) => {
		const { isFetchingConnectionInfo } = state;

		return isFetchingConnectionInfo;
	},

	isResetting: ( state ) => {
		const { isResetting } = state;

		return isResetting;
	},
};

export const controls = {
	[ FETCH_RESET ]: () => {
		return set( 'core', 'site', 'reset' );
	},
	[ FETCH_CONNECTION_INFO ]: async () => {
		return get( 'core', 'site', 'connection' );
	},
};

export const resolvers = {
	*getConnection() {
		try {
			const connectionInfo = yield actions.fetchConnectionInfo();
			return actions.receiveConnectionInfo( connectionInfo );
		} catch ( err ) {
			// TODO: Implement an error handler store...
			return actions.receiveConnectionInfoFailed( err );
		}
	},

	// *reset() {
	// 	try {
	// 		const resetResult = yield actions.fetchReset();
	// 		yield actions.resetSuccess();
	// 		return actions.initialize();
	// 	} catch ( err ) {
	// 		// TODO: Implement an error handler store...
	// 		return actions.resetFailure( err );
	// 	}
	// },
};

export default {
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
