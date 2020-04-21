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
import { STORE_NAME } from './constants';

// Actions
const FETCH_ACCOUNTS = 'FETCH_ACCOUNTS';
const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
const RECEIVE_ACCOUNTS_SUCCEEDED = 'RECEIVE_ACCOUNTS_SUCCEEDED';
const RECEIVE_ACCOUNTS_FAILED = 'RECEIVE_ACCOUNTS_FAILED';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

export const INITIAL_STATE = {
	isFetchingAccounts: false,
	accounts: undefined,
};

export const actions = {
	fetchAccounts() {
		return {
			payload: {},
			type: FETCH_ACCOUNTS,
		};
	},

	receiveAccounts( accounts ) {
		invariant( Array.isArray( accounts ), 'accounts must be an array.' );

		return {
			payload: { accounts },
			type: RECEIVE_ACCOUNTS,
		};
	},

	receiveAccountsSucceeded() {
		return {
			payload: {},
			type: RECEIVE_ACCOUNTS_SUCCEEDED,
		};
	},

	receiveAccountsFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_ACCOUNTS_FAILED,
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
		return API.get( 'modules', 'adsense', 'accounts' );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_ACCOUNTS: {
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

		case RECEIVE_ACCOUNTS_SUCCEEDED: {
			return {
				...state,
				isFetchingAccounts: false,
			};
		}

		case RECEIVE_ACCOUNTS_FAILED: {
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
		try {
			const registry = yield Data.commonActions.getRegistry();
			const existingAccounts = registry.select( STORE_NAME ).getAccounts();

			// If there are already accounts loaded in state, consider it fulfilled
			// and don't make an API request.
			if ( existingAccounts ) {
				return;
			}

			const accounts = yield actions.fetchAccounts();

			yield actions.receiveAccounts( accounts );

			return actions.receiveAccountsSucceeded();
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveAccountsFailed( error );
		}
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
