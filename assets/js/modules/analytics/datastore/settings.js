/**
 * modules/analytics data store: settings.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms';
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

const { createRegistrySelector, createRegistryControl } = Data;

// Actions
const SUBMIT_CHANGES = 'SUBMIT_CHANGES';
const START_SUBMIT_CHANGES = 'START_SUBMIT_CHANGES';
const FINISH_SUBMIT_CHANGES = 'FINISH_SUBMIT_CHANGES';

export const INITIAL_STATE = {
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
	 * Checks if changes can be submitted.
	 */
	canSubmitChanges: createRegistrySelector( ( select ) => () => {
		const {
			getAccountID,
			getInternalWebPropertyID,
			getProfileID,
			getPropertyID,
			hasExistingTagPermission,
			haveSettingsChanged,
			isDoingSubmitChanges,
		} = select( STORE_NAME );

		if ( isDoingSubmitChanges() ) {
			return false;
		}
		if ( ! haveSettingsChanged() ) {
			return false;
		}
		if ( ! isValidAccountID( getAccountID() ) ) {
			return false;
		}
		if ( ! isValidPropertySelection( getPropertyID() ) ) {
			return false;
		}
		if ( ! isValidProfileSelection( getProfileID() ) ) {
			return false;
		}
		const { getValue } = select( CORE_FORMS );
		if ( getProfileID() === PROFILE_CREATE && ! isValidProfileName( getValue( FORM_SETUP, 'profileName' ) ) ) {
			return false;
		}
		// If the property ID is valid (non-create) the internal ID must be valid as well.
		if ( isValidPropertyID( getPropertyID() ) && ! isValidInternalWebPropertyID( getInternalWebPropertyID() ) ) {
			return false;
		}
		// Do existing tag check last.
		if ( hasExistingTagPermission() === false ) {
			return false;
		}

		return true;
	} ),

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

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

