/**
 * `modules/ads` data store: settings.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { isEqual, pick } from 'lodash';

/**
 * Internal dependencies
 */
import { invalidateCache } from 'googlesitekit-api';
import { createStrictSelect } from '@/js/googlesitekit/data/utils';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '@/js/googlesitekit/data/create-settings-store';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ADS } from './constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { isValidConversionID } from '@/js/modules/ads/utils/validation';

// Invariant error messages.
export const INVARIANT_INVALID_CONVERSION_ID =
	'a valid conversionID is required to submit changes';

export async function submitChanges( { select, dispatch } ) {
	const haveSettingsChanged = select( MODULES_ADS ).haveSettingsChanged();

	// This action shouldn't be called if settings haven't changed,
	// but this prevents errors in tests.
	if ( haveSettingsChanged ) {
		const { error } = await dispatch( MODULES_ADS ).saveSettings();
		if ( error ) {
			return { error };
		}
	}

	const haveConversionTrackingSettingsChanged =
		select( CORE_SITE ).haveConversionTrackingSettingsChanged();
	if ( haveConversionTrackingSettingsChanged ) {
		const { error } = await dispatch(
			CORE_SITE
		).saveConversionTrackingSettings();

		if ( error ) {
			return { error };
		}
	}

	const haveGoogleTagGatewaySettingsChanged =
		select( CORE_SITE ).haveGoogleTagGatewaySettingsChanged();

	if ( haveGoogleTagGatewaySettingsChanged ) {
		const { error } = await dispatch(
			CORE_SITE
		).saveGoogleTagGatewaySettings();

		if ( error ) {
			return { error };
		}
	}

	await invalidateCache( 'modules', MODULE_SLUG_ADS );
	await invalidateCache( 'core', 'site', 'ads-measurement-status' );

	return {};
}

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	const {
		isDoingSubmitChanges,
		haveSettingsChanged,
		getConversionID,
		getPaxConversionID,
	} = strictSelect( MODULES_ADS );

	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );

	invariant(
		isValidConversionID( getConversionID() ) ||
			isValidConversionID( getPaxConversionID() ),
		INVARIANT_INVALID_CONVERSION_ID
	);
}

export function rollbackChanges( { select, dispatch } ) {
	if ( select( MODULES_ADS ).haveSettingsChanged() ) {
		dispatch( MODULES_ADS ).rollbackSettings();
		dispatch( CORE_SITE ).resetConversionTrackingSettings();
		dispatch( CORE_SITE ).resetGoogleTagGatewaySettings();
	}
}

export function validateHaveSettingsChanged( select, state, keys ) {
	const { settings, savedSettings } = state;
	const haveConversionTrackingSettingsChanged =
		select( CORE_SITE ).haveConversionTrackingSettingsChanged();
	const haveGoogleTagGatewaySettingsChanged =
		select( CORE_SITE ).haveGoogleTagGatewaySettingsChanged();

	if ( keys ) {
		invariant(
			isEqual( pick( settings, keys ), pick( savedSettings, keys ) ) ||
				! haveConversionTrackingSettingsChanged ||
				haveGoogleTagGatewaySettingsChanged,
			INVARIANT_SETTINGS_NOT_CHANGED
		);
	}

	invariant(
		! isEqual( settings, savedSettings ) ||
			haveConversionTrackingSettingsChanged ||
			haveGoogleTagGatewaySettingsChanged,
		INVARIANT_SETTINGS_NOT_CHANGED
	);
}
