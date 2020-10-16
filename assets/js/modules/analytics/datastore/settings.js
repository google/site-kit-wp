/**
 * `modules/analytics` data store: settings.
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
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms';
import { STORE_NAME as CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import { TYPE_MODULES } from '../../../components/data/constants';
import { invalidateCacheGroup } from '../../../components/data/invalidate-cache-group';
import {
	isValidAccountID,
	isValidInternalWebPropertyID,
	isValidPropertySelection,
	isValidProfileSelection,
	isValidPropertyID,
	isValidProfileName,
} from '../util';
import { STORE_NAME, PROPERTY_CREATE, PROFILE_CREATE, FORM_SETUP } from './constants';
import { createStrictSelect, createValidationSelector } from '../../../googlesitekit/data/utils';

const { createRegistryControl } = Data;

// Invariant error messages.
export const INVARIANT_DOING_SUBMIT_CHANGES = 'cannot submit changes while submitting changes';
export const INVARIANT_SETTINGS_NOT_CHANGED = 'cannot submit changes if settings have not changed';
export const INVARIANT_INVALID_ACCOUNT_ID = 'a valid accountID is required to submit changes';
export const INVARIANT_INVALID_PROPERTY_SELECTION = 'a valid propertyID is required to submit changes';
export const INVARIANT_INVALID_PROFILE_SELECTION = 'a valid profileID is required to submit changes';
export const INVARIANT_INSUFFICIENT_GTM_TAG_PERMISSIONS = 'cannot submit changes without having permissions for GTM property ID';
export const INVARIANT_INVALID_PROFILE_NAME = 'a valid profile name is required to submit changes';
export const INVARIANT_INVALID_INTERNAL_PROPERTY_ID = 'cannot submit changes with incorrect internal webPropertyID';
export const INVARIANT_INSUFFICIENT_TAG_PERMISSIONS = 'cannot submit without proper permissions';

// Actions
const SUBMIT_CHANGES = 'SUBMIT_CHANGES';
const START_SUBMIT_CHANGES = 'START_SUBMIT_CHANGES';
const FINISH_SUBMIT_CHANGES = 'FINISH_SUBMIT_CHANGES';

export const initialState = {
	isDoingSubmitChanges: false,
};

export const actions = {
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
};

export const controls = {
	[ SUBMIT_CHANGES ]: createRegistryControl( ( registry ) => async () => {
		let propertyID = registry.select( STORE_NAME ).getPropertyID();

		if ( propertyID === PROPERTY_CREATE ) {
			const accountID = registry.select( STORE_NAME ).getAccountID();

			const { response: property, error } = await registry.dispatch( STORE_NAME ).createProperty( accountID );

			if ( error ) {
				return { error };
			}
			propertyID = property.id;
			await registry.dispatch( STORE_NAME ).setPropertyID( property.id );
			await registry.dispatch( STORE_NAME ).setInternalWebPropertyID( property.internalWebPropertyId ); // eslint-disable-line sitekit/camelcase-acronyms
		}

		const profileID = registry.select( STORE_NAME ).getProfileID();

		if ( profileID === PROFILE_CREATE ) {
			const profileName = registry.select( CORE_FORMS ).getValue( FORM_SETUP, 'profileName' );
			const accountID = registry.select( STORE_NAME ).getAccountID();
			const { response: profile, error } = await registry.dispatch( STORE_NAME ).createProfile( accountID, propertyID, { profileName } );

			if ( error ) {
				return { error };
			}
			await registry.dispatch( STORE_NAME ).setProfileID( profile.id );
		}

		// This action shouldn't be called if settings haven't changed,
		// but this prevents errors in tests.
		if ( registry.select( STORE_NAME ).haveSettingsChanged() ) {
			const { error } = await registry.dispatch( STORE_NAME ).saveSettings();

			if ( error ) {
				return { error };
			}
		}

		await API.invalidateCache( 'modules', 'analytics' );
		// TODO: Remove once legacy dataAPI is no longer used.
		invalidateCacheGroup( TYPE_MODULES, 'analytics' );

		return {};
	} ),
};

export const reducer = ( state, { type } ) => {
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

		default: return state;
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Checks whether changes are currently being submitted.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if submitting, `false` if not.
	 */
	isDoingSubmitChanges( state ) {
		return !! state.isDoingSubmitChanges;
	},
};

const {
	safeSelector: canSubmitChanges,
	dangerousSelector: __dangerousCanSubmitChanges,
} = createValidationSelector( ( select ) => {
	const strictSelect = createStrictSelect( select );
	const {
		getAccountID,
		getInternalWebPropertyID,
		getProfileID,
		getPropertyID,
		hasExistingTagPermission,
		hasTagPermission,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( STORE_NAME );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );

	const gtmIsActive = strictSelect( CORE_MODULES ).isModuleActive( 'tagmanager' );
	if ( gtmIsActive ) {
		const gtmAnalyticsPropertyID = strictSelect( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID();
		invariant(
			! isValidPropertyID( gtmAnalyticsPropertyID ) || hasTagPermission( gtmAnalyticsPropertyID ) !== false,
			INVARIANT_DONT_HAVE_GTM_TAG_PERMISSIONS
		);
	}

	invariant( haveSettingsChanged(), INVARIANT_DONT_HAVE_SETTINGS_CHANGED );
	invariant( isValidAccountID( getAccountID() ), INVARIANT_INVALID_ACCOUNT_ID );
	invariant( isValidPropertySelection( getPropertyID() ), INVARIANT_INVALID_PROPERTY_SELECTION );
	invariant( isValidProfileSelection( getProfileID() ), INVARIANT_INVALID_PROFILE_SELECTION );

	if ( getProfileID() === PROFILE_CREATE ) {
		const profileName = select( CORE_FORMS ).getValue( FORM_SETUP, 'profileName' );
		invariant( isValidProfileName( profileName ), INVARIANT_INVALID_PROFILE_NAME );
	}

	// If the property ID is valid (non-create) the internal ID must be valid as well.
	invariant(
		! isValidPropertyID( getPropertyID() ) || isValidInternalWebPropertyID( getInternalWebPropertyID() ),
		INVARIANT_INVALID_INTERNAL_PROPERTY_ID
	);

	// Do existing tag check last.
	invariant( hasExistingTagPermission() !== false, INVARIANT_DONT_HAVE_EXISTING_TAG_PERMISSIONS );
} );

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors: {
		...selectors,
		canSubmitChanges,
		__dangerousCanSubmitChanges,
	},
};
