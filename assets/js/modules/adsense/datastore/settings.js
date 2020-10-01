/**
 * Adsense module data store: settings.
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
import { TYPE_MODULES } from '../../../components/data/constants';
import { invalidateCacheGroup } from '../../../components/data/invalidate-cache-group';
import {
	isValidAccountID,
	isValidClientID,
} from '../util';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const { commonActions, createRegistrySelector, createRegistryControl } = Data;

const fetchSaveUseSnippetStore = createFetchStore( {
	baseName: 'saveUseSnippet',
	controlCallback: ( { useSnippet } ) => {
		return API.set( 'modules', 'adsense', 'use-snippet', { useSnippet } );
	},
	reducerCallback: ( state, response, { useSnippet } ) => {
		// The server response in this case is simply `true`, so we need to
		// rely on the originally passed parameter here.
		return {
			...state,
			// Update saved settings.
			savedSettings: {
				...( state.savedSettings || {} ),
				useSnippet,
			},
			// Also update client settings to ensure they're in sync.
			settings: {
				...( state.settings || {} ),
				useSnippet,
			},
		};
	},
	argsToParams: ( useSnippet ) => {
		return { useSnippet };
	},
	validateParams: ( { useSnippet } = {} ) => {
		invariant( useSnippet !== undefined, 'useSnippet is required.' );
	},
} );

// Actions
const SUBMIT_CHANGES = 'SUBMIT_CHANGES';
const START_SUBMIT_CHANGES = 'START_SUBMIT_CHANGES';
const FINISH_SUBMIT_CHANGES = 'FINISH_SUBMIT_CHANGES';

const COMPLETE_ACCOUNT_SETUP = 'COMPLETE_ACCOUNT_SETUP';
const COMPLETE_SITE_SETUP = 'COMPLETE_SITE_SETUP';

// The original account status on pageload is a specific requirement for
// certain parts of the AdSense setup flow.
const RECEIVE_ORIGINAL_ACCOUNT_STATUS = 'RECEIVE_ORIGINAL_ACCOUNT_STATUS';

const baseInitialState = {
	isDoingSubmitChanges: false,
	originalAccountStatus: undefined,
};

const baseActions = {
	/**
	 * Saves the current value of the 'useSnippet' setting.
	 *
	 * While the saveSettings action should typically be used for this, there
	 * is a use-case where the 'useSnippet' setting (and nothing else) needs to
	 * be saved right away when being toggled, which is what this action is
	 * intended for.
	 *
	 * @since 1.9.0
	 * @private
	 */
	*saveUseSnippet() {
		const registry = yield commonActions.getRegistry();
		const useSnippet = registry.select( STORE_NAME ).getUseSnippet();
		if ( undefined === useSnippet ) {
			return;
		}

		yield fetchSaveUseSnippetStore.actions.fetchSaveUseSnippet( useSnippet );
	},

	/**
	 * Submits all changes currently present in the client, persisting them on the server.
	 *
	 * @since 1.9.0
	 *
	 * @return {Object} Empty object on success, object with `error` property on failure.
	 */
	*submitChanges() {
		const registry = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: START_SUBMIT_CHANGES,
		};

		const result = yield {
			payload: {},
			type: SUBMIT_CHANGES,
		};

		if ( result.error ) {
			yield registry.dispatch( STORE_NAME ).receiveError( result.error, 'submitChanges', [] );
		}

		yield {
			payload: {},
			type: FINISH_SUBMIT_CHANGES,
		};

		return result;
	},

	/**
	 * Sets the accountSetupComplete flag to true and submits all changes.
	 *
	 * An asynchronous action is used to invoke this action's control, which ensures
	 * `setAccountSetupComplete( true )` is called before we submit the changes.
	 * See the `COMPLETE_ACCOUNT_SETUP` control below for more.
	 *
	 * @since 1.9.0
	 *
	 * @return {boolean} True on success, false on failure.
	 */
	*completeAccountSetup() {
		const success = yield {
			payload: {},
			type: COMPLETE_ACCOUNT_SETUP,
		};
		return success;
	},

	/**
	 * Sets the siteSetupComplete flag to true and submits all changes.
	 *
	 * An asynchronous action is used to invoke this action's control, which ensures
	 * `setSiteSetupComplete( true )` is called before we submit the changes.
	 * See the `COMPLETE_SITE_SETUP` control below for more.
	 *
	 * @since 1.9.0
	 *
	 * @return {boolean} True on success, false on failure.
	 */
	*completeSiteSetup() {
		const success = yield {
			payload: {},
			type: COMPLETE_SITE_SETUP,
		};
		return success;
	},

	receiveOriginalAccountStatus( originalAccountStatus ) {
		invariant( originalAccountStatus, 'originalAccountStatus is required.' );

		return {
			payload: { originalAccountStatus },
			type: RECEIVE_ORIGINAL_ACCOUNT_STATUS,
		};
	},
};

const baseControls = {
	[ SUBMIT_CHANGES ]: createRegistryControl( ( registry ) => async () => {
		// This action shouldn't be called if settings haven't changed,
		// but this prevents errors in tests.
		if ( registry.select( STORE_NAME ).haveSettingsChanged() ) {
			const { error } = await registry.dispatch( STORE_NAME ).saveSettings();

			if ( error ) {
				return { error };
			}
		}

		await API.invalidateCache( 'modules', 'adsense' );
		// TODO: Remove once legacy dataAPI is no longer used.
		invalidateCacheGroup( TYPE_MODULES, 'adsense' );

		return {};
	} ),
	// This is a control to allow for asynchronous logic using external action dispatchers.
	[ COMPLETE_ACCOUNT_SETUP ]: createRegistryControl( ( registry ) => async () => {
		await registry.dispatch( STORE_NAME ).setAccountSetupComplete( true );
		// canSubmitChanges cannot be checked before here because the settings
		// won't have changed yet.
		if ( ! registry.select( STORE_NAME ).canSubmitChanges() ) {
			// Unset flag again.
			await registry.dispatch( STORE_NAME ).setAccountSetupComplete( false );
			return false;
		}
		const { error } = await registry.dispatch( STORE_NAME ).submitChanges();
		if ( error ) {
			// Unset flag again.
			await registry.dispatch( STORE_NAME ).setAccountSetupComplete( false );
			return false;
		}
		return true;
	} ),
	// This is a control to allow for asynchronous logic using external action dispatchers.
	[ COMPLETE_SITE_SETUP ]: createRegistryControl( ( registry ) => async () => {
		await registry.dispatch( STORE_NAME ).setSiteSetupComplete( true );
		// canSubmitChanges cannot be checked before here because the settings
		// won't have changed yet.
		if ( ! registry.select( STORE_NAME ).canSubmitChanges() ) {
			// Unset flag again.
			await registry.dispatch( STORE_NAME ).setSiteSetupComplete( false );
			return false;
		}
		const { error } = await registry.dispatch( STORE_NAME ).submitChanges();
		if ( error ) {
			// Unset flag again.
			await registry.dispatch( STORE_NAME ).setSiteSetupComplete( false );
			return false;
		}
		return true;
	} ),
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_SUBMIT_CHANGES: {
			return {
				...state,
				isDoingSubmitChanges: true,
			};
		}

		case FINISH_SUBMIT_CHANGES: {
			return {
				...state,
				isDoingSubmitChanges: false,
			};
		}

		// This action is purely for testing, the value is typically handled
		// as a side-effect from 'RECEIVE_SETTINGS' (see below).
		case RECEIVE_ORIGINAL_ACCOUNT_STATUS: {
			const { originalAccountStatus } = payload;
			return {
				...state,
				originalAccountStatus,
			};
		}

		// This action is mainly handled via createSettingsStore, but here we
		// need it to have the side effect of storing the original account
		// status.
		case 'RECEIVE_GET_SETTINGS': {
			const { response } = payload;
			const { accountStatus } = response;

			// Only set original account status when it is really the first
			// time that we load the settings on this pageload.
			if ( undefined === state.originalAccountStatus ) {
				return {
					...state,
					originalAccountStatus: accountStatus,
				};
			}

			return state;
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getOriginalAccountStatus() {
		const registry = yield commonActions.getRegistry();

		// Do not do anything if original account status already known.
		const existingOriginalAccountStatus = registry.select( STORE_NAME ).getOriginalAccountStatus();
		if ( undefined !== existingOriginalAccountStatus ) {
			return;
		}

		// Ensure settings are being fetched if not yet in progress.
		registry.select( STORE_NAME ).getSettings();
	},
};

const baseSelectors = {
	/**
	 * Checks if changes can be submitted.
	 *
	 * @since 1.9.0
	 *
	 * @return {boolean} True if changes can be submitted, false otherwise.
	 */
	canSubmitChanges: createRegistrySelector( ( select ) => () => {
		const {
			getAccountID,
			getClientID,
			getAccountStatus,
			haveSettingsChanged,
			isDoingSubmitChanges,
		} = select( STORE_NAME );

		if ( isDoingSubmitChanges() ) {
			return false;
		}
		if ( ! haveSettingsChanged() ) {
			return false;
		}
		// Require an account status to be present.
		if ( ! getAccountStatus() ) {
			return false;
		}
		// Require account ID to be either empty (if impossible to determine)
		// or valid.
		const accountID = getAccountID();
		if ( '' !== accountID && ! isValidAccountID( accountID ) ) {
			return false;
		}
		// Require client ID to be either empty (if impossible to determine)
		// or valid.
		const clientID = getClientID();
		if ( '' !== clientID && ! isValidClientID( clientID ) ) {
			return false;
		}

		return true;
	} ),

	/**
	 * Checks whether changes are currently being submitted.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if submitting, `false` if not.
	 */
	isDoingSubmitChanges( state ) {
		return !! state.isDoingSubmitChanges;
	},

	/**
	 * Checks whether the useSnippet value is currently being saved.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if saving useSnippet, `false` if not.
	 */
	isDoingSaveUseSnippet( state ) {
		// Since isFetchingSaveUseSnippet (via createFetchStore)
		// holds information based on specific values but we only need
		// generic information here, we need to check whether ANY such
		// request is in progress.
		return Object.values( state.isFetchingSaveUseSnippet ).some( Boolean );
	},

	/**
	 * Gets the original account status stored before the current pageload.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Original account status (may be an empty string), or
	 *                              undefined if not loaded yet.
	 */
	getOriginalAccountStatus( state ) {
		return state.originalAccountStatus;
	},
};

const store = Data.combineStores(
	fetchSaveUseSnippetStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
