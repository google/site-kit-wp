/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import connection from './connection';
import reset from './reset';

export const INITIAL_STATE = Data.collectState(
	connection.INITIAL_STATE,
	reset.INITIAL_STATE,
);

export const STORE_NAME = 'core/site';

export const actions = Data.collectActions(
	connection.actions,
	reset.actions,
);

export const controls = Data.collectControls(
	connection.controls,
	reset.controls,
);

export const reducer = Data.collectReducers( INITIAL_STATE, [
	connection.reducer,
	reset.reducer,
] );

export const resolvers = Data.collectResolvers(
	connection.resolvers,
	reset.resolvers,
);

export const selectors = Data.collectSelectors(
	connection.selectors,
	reset.selectors,
);

const store = {
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

export default store;
