/**
 * External dependencies
 */
import { get, set } from 'googlesitekit-api';
import { registerStore } from 'googlesitekit-data';

const DEFAULT_STATE = {
	connectionInfo: {},
};

const RESET = 'RESET';
const RESET_API_FETCH = 'RESET_API_FETCH';
const SET_CONNECTION_INFO = 'SET_CONNECTION_INFO';

const actions = {
	setConnectionInfo( connectionInfo ) {
		return {
			payload: connectionInfo,
			type: SET_CONNECTION_INFO,
		};
	},

	reset() {
		return {
			type: RESET,
		};
	},

	resetAPIFetch() {
		return {
			type: RESET_API_FETCH,
		};
	},
};

registerStore( 'core/site', {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case SET_CONNECTION_INFO: {
				const { connectionInfo } = action.payload;
				return {
					...state,
					connectionInfo,
				};
			}

    //   case "START_SALE":
    //     return {
    //       ...state,
    //       discountPercent: action.discountPercent
    //     };
		}

		return state;
	},

	actions,

	selectors: {
		getConnection( state ) {
			const { connectionInfo } = state;

			return connectionInfo;
		},
	},

	controls: {
		[ RESET_API_FETCH ]: () => {
			return set( 'site', 'data', 'reset' );
		},
	},

	resolvers: {
		*getConnection() {
			const connectionInfo = yield get( 'site', 'data', 'connection' );
			return actions.setConnectionInfo( connectionInfo );
		},
	},
} );
