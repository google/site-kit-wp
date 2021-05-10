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
import { isValidPropertySelection, isValidWebDataStreamID } from '../utils/validation';
import { invalidateCacheGroup } from '../../../components/data/invalidate-cache-group';
import { INVARIANT_DOING_SUBMIT_CHANGES, INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import { MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { STORE_NAME, PROPERTY_CREATE } from './constants';
import { TYPE_MODULES } from '../../../components/data';

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
		await dispatch( STORE_NAME ).setPropertyID( propertyID );
	}

	const webDataStreamID = select( STORE_NAME ).getWebDataStreamID();
	if ( ! isValidWebDataStreamID( webDataStreamID ) ) {
		const { response: webdatastream, error } = await dispatch( STORE_NAME ).createWebDataStream( webDataStreamID );
		if ( error ) {
			return { error };
		}

		await dispatch( STORE_NAME ).setWebDataStreamID( webdatastream._id );
	}

	if ( select( STORE_NAME ).haveSettingsChanged() ) {
		const { error } = await dispatch( STORE_NAME ).saveSettings();
		if ( error ) {
			return { error };
		}
	}

	await API.invalidateCache( 'modules', 'analytics-4' );
	// TODO: Remove once legacy dataAPI is no longer used.
	invalidateCacheGroup( TYPE_MODULES, 'analytics-4' );

	return {};
}

export function validateCanSubmitChanges( select ) {
	if ( ! select( STORE_NAME ).isAdminAPIWorking() ) {
		return;
	}

	const strictSelect = createStrictSelect( select );
	const {
		haveSettingsChanged,
		isDoingSubmitChanges,
		getPropertyID,
		getWebDataStreamID,
	} = strictSelect( STORE_NAME );

	// Note: these error messages are referenced in test assertions.
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );

	invariant( isValidPropertySelection( getPropertyID() ), INVARIANT_INVALID_PROPERTY_SELECTION );
	invariant( isValidWebDataStreamID( getWebDataStreamID() ), INVARIANT_INVALID_WEBDATASTREAM_ID );
}
