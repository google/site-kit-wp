/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { set } from 'googlesitekit-api';
import { INITIAL_STATE } from './index';

// Actions
const FETCH_RESET = 'FETCH_RESET';
const RECEIVE_RESET = 'RECEIVE_RESET';
const RECEIVE_RESET_FAILURE = 'RECEIVE_RESET_FAILURE';

export const actions = {
	fetchReset() {
		return {
			payload: {},
			type: FETCH_RESET,
		};
	},

	receiveReset() {
		return {
			payload: {},
			type: RECEIVE_RESET,
		};
	},

	receiveResetFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_RESET_FAILURE,
		};
	},

	*reset() {
		try {
			yield actions.fetchReset();
			return actions.receiveReset();
		} catch ( err ) {
			return actions.receiveResetFailed( err );
		}
	},
};

export const reducer = ( state = INITIAL_STATE, action = {} ) => {
	switch ( action.type ) {
		case FETCH_RESET: {
			return {
				...state,
				isResetting: true,
			};
		}

		case RECEIVE_RESET_FAILURE: {
			const { error } = action.payload;
			return {
				...state,
				resetError: error,
				isResetting: false,
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

export const selectors = {
	getConnection: ( state ) => {
		const { connection } = state;

		return connection;
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
};

export const resolvers = {};

export default {
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
