/**
 * `modules/adsense` data store: accounts.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { combineStores, wpControls } from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

// Actions
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

const fetchGetAccountsStore = createFetchStore( {
	baseName: 'getAccounts',
	controlCallback: () => {
		return API.get( 'modules', 'adsense', 'accounts', undefined, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, accounts ) => {
		return {
			...state,
			accounts: [ ...accounts ],
		};
	},
} );

const baseInitialState = {
	accounts: undefined,
};

const baseActions = {
	*resetAccounts() {
		yield {
			payload: {},
			type: RESET_ACCOUNTS,
		};

		yield errorStoreActions.clearErrors( 'getAccounts' );

		return yield wpControls.dispatch(
			MODULES_ADSENSE,
			'invalidateResolutionForStoreSelector',
			'getAccounts'
		);
	},
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_ACCOUNTS: {
			const {
				accountID,
				clientID,
				accountStatus,
				siteStatus,
				accountSetupComplete,
				siteSetupComplete,
			} = state.savedSettings || {};
			return {
				...state,
				accounts: baseInitialState.accounts,
				settings: {
					...( state.settings || {} ),
					accountID,
					clientID,
					accountStatus,
					siteStatus,
					accountSetupComplete,
					siteSetupComplete,
				},
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAccounts() {
		const existingAccounts = yield wpControls.select(
			MODULES_ADSENSE,
			'getAccounts'
		);

		// If there are already accounts loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingAccounts ) {
			return;
		}

		yield fetchGetAccountsStore.actions.fetchGetAccounts();
	},
};

const baseSelectors = {
	/**
	 * Gets all Google AdSense accounts this user has available.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} An array of AdSense accounts; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},
};

const store = combineStores( fetchGetAccountsStore, {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
