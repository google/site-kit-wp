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

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import { INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import { MODULES_ADS } from './constants';

export async function submitChanges( { select, dispatch } ) {
	// This action shouldn't be called if settings haven't changed,
	// but this prevents errors in tests.
	if ( select( MODULES_ADS ).haveSettingsChanged() ) {
		const { error } = await dispatch( MODULES_ADS ).saveSettings();
		if ( error ) {
			return { error };
		}
	}

	await API.invalidateCache( 'modules', 'ads' );

	return {};
}

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	const { haveSettingsChanged } = strictSelect( MODULES_ADS );

	// Since conversionID can be saved as empty value, no specific
	// validation is defined here other than confirming the settings
	// have changed.
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );
}
