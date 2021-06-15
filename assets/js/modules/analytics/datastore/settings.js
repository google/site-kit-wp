/**
 * `modules/analytics` data store: settings.
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
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';
import { INVARIANT_DOING_SUBMIT_CHANGES, INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import { TYPE_MODULES } from '../../../components/data/constants';
import { invalidateCacheGroup } from '../../../components/data/invalidate-cache-group';
import {
	isValidAccountID,
	isValidInternalWebPropertyID,
	isValidPropertySelection,
	isValidProfileSelection,
	isValidPropertyID,
	isValidProfileName,
	isValidAdsConversionID,
} from '../util';
import { STORE_NAME, PROPERTY_CREATE, PROFILE_CREATE, FORM_SETUP } from './constants';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import { isFeatureEnabled } from '../../../features';
import { isPermissionScopeError } from '../../../util/errors';

// Invariant error messages.
export const INVARIANT_INVALID_ACCOUNT_ID = 'a valid accountID is required to submit changes';
export const INVARIANT_INVALID_PROPERTY_SELECTION = 'a valid propertyID is required to submit changes';
export const INVARIANT_INVALID_PROFILE_SELECTION = 'a valid profileID is required to submit changes';
export const INVARIANT_INVALID_CONVERSION_ID = 'a valid adsConversionID is required to submit changes';
export const INVARIANT_INSUFFICIENT_GTM_TAG_PERMISSIONS = 'cannot submit changes without having permissions for GTM property ID';
export const INVARIANT_INVALID_PROFILE_NAME = 'a valid profile name is required to submit changes';
export const INVARIANT_INVALID_INTERNAL_PROPERTY_ID = 'cannot submit changes with incorrect internal webPropertyID';
export const INVARIANT_INSUFFICIENT_TAG_PERMISSIONS = 'cannot submit without proper permissions';

export async function submitChanges( { select, dispatch } ) {
	let propertyID = select( STORE_NAME ).getPropertyID();
	if ( propertyID === PROPERTY_CREATE ) {
		const accountID = select( STORE_NAME ).getAccountID();
		const { response: property, error } = await dispatch( STORE_NAME ).createProperty( accountID );

		if ( error ) {
			return { error };
		}

		propertyID = property.id;
		dispatch( STORE_NAME ).setPropertyID( property.id );
		dispatch( STORE_NAME ).setInternalWebPropertyID( property.internalWebPropertyId ); // eslint-disable-line sitekit/acronym-case
	}

	const profileID = select( STORE_NAME ).getProfileID();
	if ( profileID === PROFILE_CREATE ) {
		const profileName = select( CORE_FORMS ).getValue( FORM_SETUP, 'profileName' );
		const accountID = select( STORE_NAME ).getAccountID();
		const { response: profile, error } = await dispatch( STORE_NAME ).createProfile( accountID, propertyID, { profileName } );

		if ( error ) {
			return { error };
		}

		dispatch( STORE_NAME ).setProfileID( profile.id );
	}

	// This action shouldn't be called if settings haven't changed,
	// but this prevents errors in tests.
	if ( select( STORE_NAME ).haveSettingsChanged() ) {
		const { error } = await dispatch( STORE_NAME ).saveSettings();

		if ( error ) {
			return { error };
		}
	}

	await API.invalidateCache( 'modules', 'analytics' );
	// TODO: Remove once legacy dataAPI is no longer used.
	invalidateCacheGroup( TYPE_MODULES, 'analytics' );

	if ( isFeatureEnabled( 'ga4setup' ) ) {
		if ( select( MODULES_ANALYTICS_4 ).haveSettingsChanged() ) {
			const { error } = await dispatch( MODULES_ANALYTICS_4 ).submitChanges();
			if ( isPermissionScopeError( error ) ) {
				return { error };
			}
		}
	}

	return {};
}

export function validateCanSubmitChanges( select ) {
	const isGA4Enabled = isFeatureEnabled( 'ga4setup' );

	const strictSelect = createStrictSelect( select );
	const {
		getAccountID,
		getAdsConversionID,
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
			INVARIANT_INSUFFICIENT_GTM_TAG_PERMISSIONS
		);
	}

	invariant(
		haveSettingsChanged() || ( isGA4Enabled && select( MODULES_ANALYTICS_4 ).haveSettingsChanged() ),
		INVARIANT_SETTINGS_NOT_CHANGED,
	);

	invariant( isValidAccountID( getAccountID() ), INVARIANT_INVALID_ACCOUNT_ID );
	invariant( isValidPropertySelection( getPropertyID() ), INVARIANT_INVALID_PROPERTY_SELECTION );
	invariant( isValidProfileSelection( getProfileID() ), INVARIANT_INVALID_PROFILE_SELECTION );

	if ( getAdsConversionID() ) {
		invariant( isValidAdsConversionID( getAdsConversionID() ), INVARIANT_INVALID_CONVERSION_ID );
	}

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
	invariant( hasExistingTagPermission() !== false, INVARIANT_INSUFFICIENT_TAG_PERMISSIONS );

	if ( isGA4Enabled ) {
		select( MODULES_ANALYTICS_4 ).__dangerousCanSubmitChanges();
	}
}
