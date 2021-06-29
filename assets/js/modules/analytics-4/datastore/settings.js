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
import { isValidPropertySelection, isValidWebDataStreamID, isValidWebDataStreamSelection } from '../utils/validation';
import { INVARIANT_DOING_SUBMIT_CHANGES, INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import { MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { STORE_NAME, PROPERTY_CREATE, WEBDATASTREAM_CREATE } from './constants';

// Invariant error messages.
export const INVARIANT_INVALID_PROPERTY_SELECTION = 'a valid propertyID is required to submit changes';
export const INVARIANT_INVALID_WEBDATASTREAM_ID = 'a valid webDataStreamID is required to submit changes';

export async function submitChanges( { select, dispatch } ) {
	let propertyID = select( STORE_NAME ).getPropertyID();
	if ( propertyID === PROPERTY_CREATE ) {
		const accountID = select( MODULES_ANALYTICS ).getAccountID();
		const { response: property, error } = await dispatch( STORE_NAME ).createProperty( accountID );
		if ( error ) {
			return { error };
		}

		propertyID = property._id;
		dispatch( STORE_NAME ).setPropertyID( propertyID );
		dispatch( STORE_NAME ).setWebDataStreamID( WEBDATASTREAM_CREATE );
		dispatch( STORE_NAME ).setMeasurementID( '' );
	}

	const webDataStreamID = select( STORE_NAME ).getWebDataStreamID();
	if ( propertyID && ( webDataStreamID === WEBDATASTREAM_CREATE || ! isValidWebDataStreamID( webDataStreamID ) ) ) {
		const { response: webdatastream, error } = await dispatch( STORE_NAME ).createWebDataStream( propertyID );
		if ( error ) {
			return { error };
		}

		dispatch( STORE_NAME ).setWebDataStreamID( webdatastream._id );
		dispatch( STORE_NAME ).setMeasurementID( webdatastream.measurementId ); // eslint-disable-line sitekit/acronym-case
	}

	if ( select( STORE_NAME ).haveSettingsChanged() ) {
		const { error } = await dispatch( STORE_NAME ).saveSettings();
		if ( error ) {
			return { error };
		}
	}

	await API.invalidateCache( 'modules', 'analytics-4' );

	return {};
}

export function validateCanSubmitChanges( select ) {
	if ( select( STORE_NAME ).isAdminAPIWorking() === false ) {
		return;
	}

	const {
		haveSettingsChanged: haveGA4SettingsChanged,
		isDoingSubmitChanges,
		getPropertyID,
		getWebDataStreamID,
	} = createStrictSelect( select )( STORE_NAME );

	const {
		haveSettingsChanged: haveUASettingsChanged,
	} = createStrictSelect( select )( MODULES_ANALYTICS );

	// Check if we have GA4 settings changed only if we are sure that there is no UA changes.
	if ( ! haveUASettingsChanged() ) {
		invariant( haveGA4SettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );
	}

	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );

	const propertyID = getPropertyID();
	invariant( propertyID === '' || isValidPropertySelection( propertyID ), INVARIANT_INVALID_PROPERTY_SELECTION );
	if ( propertyID && propertyID !== PROPERTY_CREATE ) {
		invariant( isValidWebDataStreamSelection( getWebDataStreamID() ), INVARIANT_INVALID_WEBDATASTREAM_ID );
	}
}
