/**
 * `modules/tagmanager` data store: accounts.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { MODULES_TAGMANAGER, CONTAINER_CREATE } from './constants';
import { actions as containerActions } from './containers';
import { isValidAccountSelection } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { ACCOUNT_CREATE } from '../../analytics-4/datastore/constants';

// Actions
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

const fetchGetAccountsStore = createFetchStore( {
	baseName: 'getAccounts',
	controlCallback: () =>
		API.get( 'modules', 'tagmanager', 'accounts', null, {
			useCache: false,
		} ),
	reducerCallback: ( state, accounts ) => {
		return {
			...state,
			accounts,
		};
	},
} );

export const baseInitialState = {
	accounts: undefined,
};

export const baseActions = {
	/**
	 * Clears received accounts, and unsets related selections.
	 *
	 * The `getAccounts` selector will be invalidated to allow accounts to be re-fetched from the server.
	 *
	 * @since 1.12.0
	 * @private
	 */
	*resetAccounts() {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ACCOUNTS,
		};

		dispatch( MODULES_TAGMANAGER ).invalidateResolutionForStoreSelector(
			'getAccounts'
		);
	},

	/**
	 * Selects the given account and makes related selections.
	 *
	 * @since 1.12.0
	 * @private
	 *
	 * @param {string} accountID Tag Manager account ID to select.
	 */
	selectAccount: createValidatedAction(
		( accountID ) => {
			invariant(
				isValidAccountSelection( accountID ),
				'A valid accountID selection is required to select.'
			);
		},
		function* ( accountID ) {
			const { select, dispatch } = yield commonActions.getRegistry();

			// Do nothing if the accountID to select is the same as the current.
			if ( accountID === select( MODULES_TAGMANAGER ).getAccountID() ) {
				return;
			}

			dispatch( MODULES_TAGMANAGER ).setSettings( {
				accountID,
				containerID: '',
				internalContainerID: '',
				ampContainerID: '',
				internalAMPContainerID: '',
			} );

			if (
				ACCOUNT_CREATE === accountID ||
				select( MODULES_TAGMANAGER ).hasExistingTag()
			) {
				return;
			}

			// Containers may not be loaded yet for this account,
			// and no selections are done in the getContainers resolver, so we wait here.
			// This will not guarantee that containers exist, as an account may also have no containers
			// it will simply wait for `getContainers` to be resolved for this account ID.
			yield containerActions.waitForContainers( accountID );
			// Trigger cascading selections.
			const { isAMP, isSecondaryAMP } = select( CORE_SITE );
			if ( ! isAMP() || isSecondaryAMP() ) {
				const webContainers =
					select( MODULES_TAGMANAGER ).getWebContainers( accountID );

				if ( ! webContainers.length ) {
					dispatch( MODULES_TAGMANAGER ).setContainerID(
						CONTAINER_CREATE
					);
					dispatch( MODULES_TAGMANAGER ).setInternalContainerID( '' );
				} else if ( webContainers.length === 1 ) {
					dispatch( MODULES_TAGMANAGER ).setContainerID(
						// eslint-disable-next-line sitekit/acronym-case
						webContainers[ 0 ].publicId
					);
					dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
						// eslint-disable-next-line sitekit/acronym-case
						webContainers[ 0 ].containerId
					);
				}
			}

			if ( isAMP() ) {
				const ampContainers =
					select( MODULES_TAGMANAGER ).getAMPContainers( accountID );

				if ( ! ampContainers.length ) {
					dispatch( MODULES_TAGMANAGER ).setAMPContainerID(
						CONTAINER_CREATE
					);
					dispatch( MODULES_TAGMANAGER ).setInternalAMPContainerID(
						''
					);
				} else if ( ampContainers.length === 1 ) {
					dispatch( MODULES_TAGMANAGER ).setAMPContainerID(
						// eslint-disable-next-line sitekit/acronym-case
						ampContainers[ 0 ].publicId
					);
					dispatch( MODULES_TAGMANAGER ).setInternalAMPContainerID(
						// eslint-disable-next-line sitekit/acronym-case
						ampContainers[ 0 ].containerId
					);
				}
			}
		}
	),
};

export const baseReducer = ( state, { type } ) => {
	switch ( type ) {
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
			return state;
		}
	}
};

export const baseResolvers = {
	*getAccounts() {
		const { select, dispatch } = yield commonActions.getRegistry();
		let accounts = select( MODULES_TAGMANAGER ).getAccounts();

		// Only fetch accounts if they have not been received yet.
		if ( ! accounts ) {
			( { response: accounts } =
				yield fetchGetAccountsStore.actions.fetchGetAccounts() );
		}

		if (
			accounts?.length === 1 &&
			! select( MODULES_TAGMANAGER ).getAccountID()
		) {
			dispatch( MODULES_TAGMANAGER ).selectAccount(
				// eslint-disable-next-line sitekit/acronym-case
				accounts[ 0 ].accountId
			);
		}
	},
};

export const baseSelectors = {
	/**
	 * Gets all Google Tag Manager accounts this user can access.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Array.<Object>} An array of account objects; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Checks whether accounts are currently being fetched.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Whether accounts are currently being fetched or not.
	 */
	isDoingGetAccounts: createRegistrySelector( ( select ) => () => {
		return select( MODULES_TAGMANAGER ).isFetchingGetAccounts();
	} ),
};

const store = combineStores( fetchGetAccountsStore, {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
