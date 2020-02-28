/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { collectReducers } from 'assets/js/googlesitekit/data/utils';
import connection from './connection';
import reset from './reset';

export const INITIAL_STATE = {
	connection: null,
	isFetchingConnection: false,
	isResetting: false,
};

export const STORE_NAME = 'core/site';

export const actions = {
	...connection.actions,
	...reset.actions,
};

export const controls = {
	...connection.controls,
	...reset.controls,
};

export const reducer = collectReducers( INITIAL_STATE, [
	connection.reducer,
	reset.reducer,
] );

export const resolvers = {
	...connection.resolvers,
	...reset.resolvers,
};

export const selectors = {
	...connection.selectors,
	...reset.selectors,
};

const store = {
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

export default store;
