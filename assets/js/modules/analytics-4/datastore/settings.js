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
import { isEqual, pick } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import {
	isValidPropertyID,
	isValidPropertySelection,
	isValidWebDataStreamID,
	isValidWebDataStreamName,
	isValidWebDataStreamSelection,
} from '../utils/validation';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY } from '../constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER,
	FORM_SETUP,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from './constants';
import { isValidConversionID } from '../../ads/utils/validation';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_NOTIFICATIONS } from '../../../googlesitekit/notifications/datastore/constants';
import { FPM_SETUP_CTA_BANNER_NOTIFICATION } from '../../../googlesitekit/notifications/constants';

// Invariant error messages.
export const INVARIANT_INVALID_PROPERTY_SELECTION =
	'a valid propertyID is required to submit changes';
export const INVARIANT_INVALID_WEBDATASTREAM_ID =
	'a valid webDataStreamID is required to submit changes';
export const INVARIANT_INVALID_WEBDATASTREAM_NAME =
	'a valid web data stream name is required to submit changes';
export const INVARIANT_WEBDATASTREAM_ALREADY_EXISTS =
	'a web data stream with the same name already exists';
export const INVARIANT_INVALID_ADS_CONVERSION_ID =
	'a valid ads adsConversionID is required to submit changes';

export function isSettingsLoading( select ) {
	return ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
		'getAccountSummaries'
	);
}

export async function submitChanges( { select, dispatch } ) {
	let propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
	if ( propertyID === PROPERTY_CREATE ) {
		const accountID = select( MODULES_ANALYTICS_4 ).getAccountID();
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
	if ( propertyID && webDataStreamID === WEBDATASTREAM_CREATE ) {
		const webDataStreamName = select( CORE_FORMS ).getValue(
			FORM_SETUP,
			'webDataStreamName'
		);

		let webDataStreamAlreadyExists = false;

		if ( isValidPropertyID( propertyID ) ) {
			await dispatch( MODULES_ANALYTICS_4 ).waitForWebDataStreams(
				propertyID
			);

			webDataStreamAlreadyExists = select(
				MODULES_ANALYTICS_4
			).doesWebDataStreamExist( propertyID, webDataStreamName );
		}

		if (
			isValidWebDataStreamName( webDataStreamName ) &&
			false === webDataStreamAlreadyExists
		) {
			const { response: webdatastream, error } = await dispatch(
				MODULES_ANALYTICS_4
			).createWebDataStream( propertyID, webDataStreamName );
			if ( error ) {
				return { error };
			}

			webDataStreamID = webdatastream._id;
			dispatch( MODULES_ANALYTICS_4 ).setWebDataStreamID(
				webDataStreamID
			);
			await dispatch(
				MODULES_ANALYTICS_4
			).updateSettingsForMeasurementID(
				// eslint-disable-next-line sitekit/acronym-case
				webdatastream.webStreamData.measurementId
			);
		}
	}

	if (
		isValidPropertyID( propertyID ) &&
		isValidWebDataStreamID( webDataStreamID )
	) {
		const isEnhancedMeasurementEnabled = select( CORE_FORMS ).getValue(
			ENHANCED_MEASUREMENT_FORM,
			ENHANCED_MEASUREMENT_ENABLED
		);

		// Only make the API request to enable the Enhanced Measurement setting, not to disable it.
		if ( isEnhancedMeasurementEnabled ) {
			const { error } = await updateEnhancedMeasurementSettings( {
				select,
				dispatch,
				propertyID,
				webDataStreamID,
				isEnhancedMeasurementEnabled,
			} );

			if ( error ) {
				return { error };
			}
		}
	}

	const { error } = await saveSettings( select, dispatch );

	if ( error ) {
		return { error };
	}

	dispatch( CORE_USER ).resetAudienceSettings();

	await API.invalidateCache( 'modules', 'analytics-4' );

	return {};
}

async function saveSettings( select, dispatch ) {
	const haveSettingsChanged =
		select( MODULES_ANALYTICS_4 ).haveSettingsChanged();

	if ( haveSettingsChanged ) {
		const { error } = await dispatch( MODULES_ANALYTICS_4 ).saveSettings();
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

	const haveFirstPartyModeSettingsChanged =
		select( CORE_SITE ).haveFirstPartyModeSettingsChanged();
	if ( haveFirstPartyModeSettingsChanged ) {
		const { error } = await dispatch(
			CORE_SITE
		).saveFirstPartyModeSettings();

		if ( error ) {
			return { error };
		}

		if (
			select( CORE_SITE ).isFirstPartyModeEnabled() &&
			! select( CORE_NOTIFICATIONS ).isNotificationDismissed(
				FPM_SETUP_CTA_BANNER_NOTIFICATION
			)
		) {
			const { error: dismissError } =
				( await dispatch( CORE_NOTIFICATIONS ).dismissNotification(
					FPM_SETUP_CTA_BANNER_NOTIFICATION
				) ) || {};

			if ( dismissError ) {
				return { error: dismissError };
			}
		}
	}

	return {};
}

async function updateEnhancedMeasurementSettings( {
	select,
	dispatch,
	propertyID,
	webDataStreamID,
	isEnhancedMeasurementEnabled,
} ) {
	await dispatch( MODULES_ANALYTICS_4 ).setEnhancedMeasurementStreamEnabled(
		propertyID,
		webDataStreamID,
		isEnhancedMeasurementEnabled
	);

	if (
		select( MODULES_ANALYTICS_4 ).haveEnhancedMeasurementSettingsChanged(
			propertyID,
			webDataStreamID
		)
	) {
		const { error } = await dispatch(
			MODULES_ANALYTICS_4
		).updateEnhancedMeasurementSettings( propertyID, webDataStreamID );

		if ( error ) {
			return { error };
		}

		const shouldDismissActivationBanner = select( CORE_FORMS ).getValue(
			ENHANCED_MEASUREMENT_FORM,
			ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER
		);

		if ( shouldDismissActivationBanner ) {
			await dispatch( CORE_USER ).dismissItem(
				ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY
			);
		}
	}

	return {};
}

export function rollbackChanges( { select, dispatch } ) {
	if ( select( MODULES_ANALYTICS_4 ).haveSettingsChanged() ) {
		dispatch( MODULES_ANALYTICS_4 ).rollbackSettings();
		dispatch( CORE_SITE ).resetConversionTrackingSettings();
		dispatch( CORE_SITE ).resetFirstPartyModeSettings();
	}

	dispatch( MODULES_ANALYTICS_4 ).resetEnhancedMeasurementSettings();
}

export function validateCanSubmitChanges( select ) {
	const {
		haveAnyGA4SettingsChanged,
		isDoingSubmitChanges,
		getPropertyID,
		getWebDataStreamID,
		doesWebDataStreamExist,
		getAdsConversionID,
	} = createStrictSelect( select )( MODULES_ANALYTICS_4 );

	invariant( haveAnyGA4SettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );

	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );

	const propertyID = getPropertyID();

	invariant(
		isValidPropertySelection( propertyID ),
		INVARIANT_INVALID_PROPERTY_SELECTION
	);

	const webDataStreamID = getWebDataStreamID();

	invariant(
		isValidWebDataStreamSelection( webDataStreamID ),
		INVARIANT_INVALID_WEBDATASTREAM_ID
	);

	if ( webDataStreamID === WEBDATASTREAM_CREATE ) {
		const webDataStreamName = select( CORE_FORMS ).getValue(
			FORM_SETUP,
			'webDataStreamName'
		);

		invariant(
			isValidWebDataStreamName( webDataStreamName ),
			INVARIANT_INVALID_WEBDATASTREAM_NAME
		);

		if ( isValidPropertyID( propertyID ) ) {
			invariant(
				false ===
					doesWebDataStreamExist( propertyID, webDataStreamName ),
				INVARIANT_WEBDATASTREAM_ALREADY_EXISTS
			);
		}
	}

	const adsConversionID = getAdsConversionID();

	if ( adsConversionID !== '' ) {
		invariant(
			isValidConversionID( adsConversionID ),
			INVARIANT_INVALID_ADS_CONVERSION_ID
		);
	}
}

export function validateHaveSettingsChanged( select, state, keys ) {
	const { settings, savedSettings } = state;
	const haveConversionTrackingSettingsChanged =
		select( CORE_SITE ).haveConversionTrackingSettingsChanged();

	const haveFirstPartyModeSettingsChanged =
		select( CORE_SITE ).haveFirstPartyModeSettingsChanged();

	if ( keys ) {
		invariant(
			! isEqual( pick( settings, keys ), pick( savedSettings, keys ) ) ||
				haveConversionTrackingSettingsChanged ||
				haveFirstPartyModeSettingsChanged,
			INVARIANT_SETTINGS_NOT_CHANGED
		);
	}

	invariant(
		! isEqual( settings, savedSettings ) ||
			haveConversionTrackingSettingsChanged ||
			haveFirstPartyModeSettingsChanged,
		INVARIANT_SETTINGS_NOT_CHANGED
	);
}
