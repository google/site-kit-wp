/**
 * `modules/analytics-4` data store: settings.
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
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import {
	isValidPropertyID,
	isValidPropertySelection,
	isValidWebDataStreamID,
	isValidWebDataStreamSelection,
} from '../utils/validation';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	FORM_SETUP,
	MODULES_ANALYTICS,
} from '../../analytics/datastore/constants';
import { ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY } from '../constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from './constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { isFeatureEnabled } from '../../../features';

// Invariant error messages.
export const INVARIANT_INVALID_PROPERTY_SELECTION =
	'a valid propertyID is required to submit changes';
export const INVARIANT_INVALID_WEBDATASTREAM_ID =
	'a valid webDataStreamID is required to submit changes';

export async function submitChanges( { select, dispatch } ) {
	let propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
	if ( propertyID === PROPERTY_CREATE ) {
		const accountID = select( MODULES_ANALYTICS ).getAccountID();
		const { response: property, error } = await dispatch(
			MODULES_ANALYTICS_4
		).createProperty( accountID );
		if ( error ) {
			return { error };
		}

		propertyID = property._id;
		dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
		dispatch( MODULES_ANALYTICS_4 ).setWebDataStreamID(
			WEBDATASTREAM_CREATE
		);
		await dispatch( MODULES_ANALYTICS_4 ).updateSettingsForMeasurementID(
			''
		);
	}

	let webDataStreamID = select( MODULES_ANALYTICS_4 ).getWebDataStreamID();
	if (
		propertyID &&
		( webDataStreamID === WEBDATASTREAM_CREATE ||
			! isValidWebDataStreamID( webDataStreamID ) )
	) {
		const { response: webdatastream, error } = await dispatch(
			MODULES_ANALYTICS_4
		).createWebDataStream( propertyID );
		if ( error ) {
			return { error };
		}

		webDataStreamID = webdatastream._id;
		dispatch( MODULES_ANALYTICS_4 ).setWebDataStreamID( webDataStreamID );
		await dispatch( MODULES_ANALYTICS_4 ).updateSettingsForMeasurementID(
			// eslint-disable-next-line sitekit/acronym-case
			webdatastream.webStreamData.measurementId
		);
	}

	if (
		isFeatureEnabled( 'enhancedMeasurement' ) &&
		isValidPropertyID( propertyID ) &&
		isValidWebDataStreamID( webDataStreamID )
	) {
		const isEnhancedMeasurementEnabled = select( CORE_FORMS ).getValue(
			ENHANCED_MEASUREMENT_FORM,
			ENHANCED_MEASUREMENT_ENABLED
		);

		// Only make the API request to enable the Enhanced Measurement setting, not to disable it.
		if ( isEnhancedMeasurementEnabled ) {
			await dispatch(
				MODULES_ANALYTICS_4
			).setEnhancedMeasurementStreamEnabled(
				propertyID,
				webDataStreamID,
				isEnhancedMeasurementEnabled
			);

			if (
				select(
					MODULES_ANALYTICS_4
				).haveEnhancedMeasurementSettingsChanged(
					propertyID,
					webDataStreamID
				)
			) {
				const { error } = await dispatch(
					MODULES_ANALYTICS_4
				).updateEnhancedMeasurementSettings(
					propertyID,
					webDataStreamID
				);

				if ( error ) {
					return { error };
				}

				const shouldDismissActivationBanner = select(
					CORE_FORMS
				).getValue(
					ENHANCED_MEASUREMENT_FORM,
					ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER
				);

				if ( shouldDismissActivationBanner ) {
					await dispatch( CORE_USER ).dismissItem(
						ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY
					);
				}
			}
		}
	}

	if ( select( MODULES_ANALYTICS_4 ).haveSettingsChanged() ) {
		const { error } = await dispatch( MODULES_ANALYTICS_4 ).saveSettings();
		if ( error ) {
			return { error };
		}

		if (
			select( CORE_MODULES ).isModuleConnected( 'analytics' ) &&
			! select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
		) {
			// Refresh modules from server if GA4 was connected after initial setup.
			await dispatch( CORE_MODULES ).fetchGetModules();
		}
	}

	await API.invalidateCache( 'modules', 'analytics-4' );

	return {};
}

export function rollbackChanges( { select, dispatch } ) {
	dispatch( CORE_FORMS ).setValues( FORM_SETUP, { enableGA4: undefined } );

	if ( select( MODULES_ANALYTICS_4 ).haveSettingsChanged() ) {
		dispatch( MODULES_ANALYTICS_4 ).rollbackSettings();
	}

	if ( isFeatureEnabled( 'enhancedMeasurement' ) ) {
		dispatch( MODULES_ANALYTICS_4 ).resetEnhancedMeasurementSettings();
	}
}

export function validateCanSubmitChanges( select ) {
	const {
		haveAnyGA4SettingsChanged,
		isDoingSubmitChanges,
		getPropertyID,
		getWebDataStreamID,
	} = createStrictSelect( select )( MODULES_ANALYTICS_4 );

	const { haveSettingsChanged: haveUASettingsChanged } =
		createStrictSelect( select )( MODULES_ANALYTICS );

	// Check if GA4 / enhanced measurement settings are changed only if we are sure that there are no UA changes.
	if ( ! haveUASettingsChanged() ) {
		invariant(
			haveAnyGA4SettingsChanged(),
			INVARIANT_SETTINGS_NOT_CHANGED
		);
	}

	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );

	const propertyID = getPropertyID();
	invariant(
		isValidPropertySelection( propertyID ),
		INVARIANT_INVALID_PROPERTY_SELECTION
	);
	if ( propertyID !== PROPERTY_CREATE ) {
		invariant(
			isValidWebDataStreamSelection( getWebDataStreamID() ),
			INVARIANT_INVALID_WEBDATASTREAM_ID
		);
	}
}
