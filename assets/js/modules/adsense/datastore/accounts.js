/**
 * modules/adsense data store: accounts.
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
import Data from 'googlesitekit-data';
import { STORE_NAME } from './index';

// Actions
const FETCH_ACCOUNTS = 'FETCH_ACCOUNTS';
const START_FETCH_ACCOUNTS = 'START_FETCH_ACCOUNTS';
const FINISH_FETCH_ACCOUNTS = 'FINISH_FETCH_ACCOUNTS';
const CATCH_FETCH_ACCOUNTS = 'CATCH_FETCH_ACCOUNTS';

const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

export const INITIAL_STATE = {
	isFetchingAccounts: false,
	accounts: undefined,
};

export const actions = {
	*fetchAccounts() {
		let response, error;

		yield {
			payload: {},
			type: START_FETCH_ACCOUNTS,
		};

		try {
			response = yield {
				payload: {},
				type: FETCH_ACCOUNTS,
			};

			yield actions.receiveAccounts( response );

			yield {
				payload: {},
				type: FINISH_FETCH_ACCOUNTS,
			};
		} catch ( err ) {
			error = err;

			yield {
				payload: { error },
				type: CATCH_FETCH_ACCOUNTS,
			};
		}

		return { response, error };
	},

	receiveAccounts( accounts ) {
		invariant( Array.isArray( accounts ), 'accounts must be an array.' );

		return {
			payload: { accounts },
			type: RECEIVE_ACCOUNTS,
		};
	},

	*resetAccounts() {
		const registry = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ACCOUNTS,
		};

		return registry.stores[ STORE_NAME ].getActions()
			.invalidateResolutionForStoreSelector( 'getAccounts' );
	},
};

export const controls = {
	[ FETCH_ACCOUNTS ]: () => {
		return API.get( 'modules', 'adsense', 'accounts', undefined, {
			useCache: false,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_ACCOUNTS: {
			return {
				...state,
				isFetchingAccounts: true,
			};
		}

		case RECEIVE_ACCOUNTS: {
			const { accounts } = payload;

			return {
				...state,
				accounts: [ ...accounts ],
			};
		}

		case FINISH_FETCH_ACCOUNTS: {
			return {
				...state,
				isFetchingAccounts: false,
			};
		}

		case CATCH_FETCH_ACCOUNTS: {
			const { error } = payload;

			return {
				...state,
				error,
				isFetchingAccounts: false,
			};
		}

		case RESET_ACCOUNTS: {
			return {
				...state,
				accounts: undefined,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getAccounts() {
		const registry = yield Data.commonActions.getRegistry();
		const existingAccounts = registry.select( STORE_NAME ).getAccounts();

		// If there are already accounts loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingAccounts ) {
			return;
		}

		yield actions.fetchAccounts();
	},
};

export const selectors = {
	/**
	 * Get all Google AdSense accounts this user has available.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Array.<Object>} An array of AdSense accounts; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
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
