/**
 * `modules/adsense` data store: settings.
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
import Data from 'googlesitekit-data';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import { isValidAccountID, isValidClientID } from '../util';
import { MODULES_ADSENSE } from './constants';
import { createStrictSelect } from '../../../googlesitekit/data/utils';

const { commonActions, createRegistryControl } = Data;

// Invariant error messages.
export const INVARIANT_MISSING_ACCOUNT_STATUS =
	'require an account status to be present';
export const INVARIANT_INVALID_ACCOUNT_ID =
	'require account ID to be either empty (if impossible to determine) or valid';
export const INVARIANT_INVALID_CLIENT_ID =
	'require client ID to be either empty (if impossible to determine) or valid';

// Actions
const COMPLETE_ACCOUNT_SETUP = 'COMPLETE_ACCOUNT_SETUP';
const COMPLETE_SITE_SETUP = 'COMPLETE_SITE_SETUP';

// The original account status on pageload is a specific requirement for
// certain parts of the AdSense setup flow.
const RECEIVE_ORIGINAL_ACCOUNT_STATUS = 'RECEIVE_ORIGINAL_ACCOUNT_STATUS';
// The original use-snippet on pageload is a specific requirement for
// certain parts of the AdSense setup flow.
const RECEIVE_ORIGINAL_USE_SNIPPET = 'RECEIVE_ORIGINAL_USE_SNIPPET';

const baseInitialState = {
	originalAccountStatus: undefined,
	originalUseSnippet: undefined,
};

const baseActions = {
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
		invariant(
			originalAccountStatus,
			'originalAccountStatus is required.'
		);

		return {
			payload: { originalAccountStatus },
			type: RECEIVE_ORIGINAL_ACCOUNT_STATUS,
		};
	},

	receiveOriginalUseSnippet( originalUseSnippet ) {
		invariant( originalUseSnippet, 'originalUseSnippet is required.' );

		return {
			payload: { originalUseSnippet },
			type: RECEIVE_ORIGINAL_USE_SNIPPET,
		};
	},
};

const baseControls = {
	// This is a control to allow for asynchronous logic using external action dispatchers.
	[ COMPLETE_ACCOUNT_SETUP ]: createRegistryControl(
		( registry ) => async () => {
			await registry
				.dispatch( MODULES_ADSENSE )
				.setAccountSetupComplete( true );
			// canSubmitChanges cannot be checked before here because the settings
			// won't have changed yet.
			if ( ! registry.select( MODULES_ADSENSE ).canSubmitChanges() ) {
				// Unset flag again.
				await registry
					.dispatch( MODULES_ADSENSE )
					.setAccountSetupComplete( false );
				return false;
			}
			const { error } = await registry
				.dispatch( MODULES_ADSENSE )
				.submitChanges();
			if ( error ) {
				// Unset flag again.
				await registry
					.dispatch( MODULES_ADSENSE )
					.setAccountSetupComplete( false );
				return false;
			}
			return true;
		}
	),
	// This is a control to allow for asynchronous logic using external action dispatchers.
	[ COMPLETE_SITE_SETUP ]: createRegistryControl(
		( registry ) => async () => {
			await registry
				.dispatch( MODULES_ADSENSE )
				.setSiteSetupComplete( true );
			// canSubmitChanges cannot be checked before here because the settings
			// won't have changed yet.
			if ( ! registry.select( MODULES_ADSENSE ).canSubmitChanges() ) {
				// Unset flag again.
				await registry
					.dispatch( MODULES_ADSENSE )
					.setSiteSetupComplete( false );
				return false;
			}
			const { error } = await registry
				.dispatch( MODULES_ADSENSE )
				.submitChanges();
			if ( error ) {
				// Unset flag again.
				await registry
					.dispatch( MODULES_ADSENSE )
					.setSiteSetupComplete( false );
				return false;
			}
			return true;
		}
	),
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		// This action is purely for testing, the value is typically handled
		// as a side-effect from 'RECEIVE_SETTINGS' (see below).
		case RECEIVE_ORIGINAL_ACCOUNT_STATUS: {
			const { originalAccountStatus } = payload;
			return {
				...state,
				originalAccountStatus,
			};
		}

		// This action is purely for testing, the value is typically handled
		// as a side-effect from 'RECEIVE_SETTINGS' (see below).
		case RECEIVE_ORIGINAL_USE_SNIPPET: {
			const { originalUseSnippet } = payload;
			return {
				...state,
				originalUseSnippet,
			};
		}

		// This action is mainly handled via createSettingsStore, but here we
		// need it to have the side effect of storing the original account
		// status and useSnippet.
		case 'RECEIVE_GET_SETTINGS': {
			const { response } = payload;
			const { accountStatus, useSnippet } = response;

			// Only set original account status AND original useSnippet when it is really the first
			// time that we load the settings on this pageload.
			return {
				...state,
				...( undefined === state.originalAccountStatus && {
					originalAccountStatus: accountStatus,
				} ),
				...( undefined === state.originalUseSnippet && {
					originalUseSnippet: useSnippet,
				} ),
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getOriginalUseSnippet() {
		const registry = yield commonActions.getRegistry();

		// Do not do anything if original useSnippet is already known.
		const existingOriginalUseSnippet = registry
			.select( MODULES_ADSENSE )
			.getOriginalUseSnippet();
		if ( undefined !== existingOriginalUseSnippet ) {
			return;
		}

		// Ensure settings are being fetched if not yet in progress.
		registry.select( MODULES_ADSENSE ).getSettings();
	},
};

const baseSelectors = {
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

	/**
	 * Gets the original useSnippet stored before the current pageload.
	 *
	 * @since 1.72.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Original useSnippet, or undefined if not loaded yet.
	 */
	getOriginalUseSnippet( state ) {
		return state.originalUseSnippet;
	},
};

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	const {
		getAccountID,
		getClientID,
		getAccountStatus,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( MODULES_ADSENSE );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );
	invariant( getAccountStatus(), INVARIANT_MISSING_ACCOUNT_STATUS );

	const accountID = getAccountID();
	invariant(
		'' === accountID || isValidAccountID( accountID ),
		INVARIANT_INVALID_ACCOUNT_ID
	);

	const clientID = getClientID();
	invariant(
		'' === clientID || isValidClientID( clientID ),
		INVARIANT_INVALID_CLIENT_ID
	);
}

const store = Data.combineStores( {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
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
