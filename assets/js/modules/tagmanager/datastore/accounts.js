/**
 * modules/analytics data store: accounts.
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
import { STORE_NAME, ACCOUNT_CREATE } from './constants';
import { isValidAccountSelection } from '../util/validation';

// Actions
const FETCH_ACCOUNTS = 'FETCH_ACCOUNTS';
const START_FETCH_ACCOUNTS = 'START_FETCH_ACCOUNTS';
const FINISH_FETCH_ACCOUNTS = 'FINISH_FETCH_ACCOUNTS';
const CATCH_FETCH_ACCOUNTS = 'CATCH_FETCH_ACCOUNTS';

const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

export const INITIAL_STATE = {
	accounts: undefined,
	isFetchingAccounts: false,
};

export const actions = {
	*fetchAccounts( data ) {
		let response, error;

		yield {
			payload: { data },
			type: START_FETCH_ACCOUNTS,
		};

		try {
			response = yield {
				payload: { data },
				type: FETCH_ACCOUNTS,
			};

			yield actions.receiveAccounts( response );

			yield {
				payload: { data },
				type: FINISH_FETCH_ACCOUNTS,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					data,
					error,
				},
				type: CATCH_FETCH_ACCOUNTS,
			};
		}

		return { response, error };
	},

	/**
	 * Creates an action for receiving accounts.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Array} accounts Accounts to receive.
	 * @return {Object} action object.
	 */
	receiveAccounts( accounts ) {
		invariant( Array.isArray( accounts ), 'accounts must be an array.' );

		return {
			payload: { accounts },
			type: RECEIVE_ACCOUNTS,
		};
	},

	*resetAccounts() {
		const registry = yield Data.commonActions.getRegistry();

		yield { type: RESET_ACCOUNTS };

		return registry.stores[ STORE_NAME ].getActions()
			.invalidateResolutionForStoreSelector( 'getAccounts' );
	},

	*selectAccount( accountID ) {
		invariant( isValidAccountSelection( accountID ), 'A valid accountID is required to select.' );

		const registry = yield Data.commonActions.getRegistry();
		registry.dispatch( STORE_NAME ).setAccountID( accountID );

		if ( ACCOUNT_CREATE === accountID ) {

		}

		// Trigger cascading selections.
	},
};

export const controls = {
	[ FETCH_ACCOUNTS ]: ( { payload } ) => {
		return API.get( 'modules', 'tagmanager', 'accounts', payload.data, {
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
				settings: {
					...state.settings,
					accountID: undefined,
					ampContainerID: undefined,
					containerID: undefined,
					internalAMPContainerID: undefined,
					internalContainerID: undefined,
				},
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

		// Only fetch accounts if there are none in the store.
		if ( ! existingAccounts ) {
			yield actions.fetchAccounts();
		}
	},
};

export const selectors = {
	/**
	 * Gets all Google Tag Manager accounts this user can access.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Array.<Object>} An array of account objects; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Gets an error encountered by this store or its side effects.
	 *
	 * Returns an object with the shape when there is an error:
	 * ```
	 * {
	 *   code,
	 *   message,
	 * }
	 * ```
	 *
	 * Returns `null` if there was no error.
	 *
	 * Marked as private, because in the future we'll have more robust error
	 * handling.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Object} Any error encountered with requests in state.
	 */
	getError( state ) {
		const { error } = state;

		return error || null;
	},

	/**
	 * Checks whether accounts are currently being fetched.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Whether accounts are currently being fetched or not.
	 */
	isDoingGetAccounts( state ) {
		return !! state.isFetchingAccounts;
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
