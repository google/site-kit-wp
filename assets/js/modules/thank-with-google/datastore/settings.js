/**
 * `modules/thank-with-google` data store: settings.
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
import { MODULES_THANK_WITH_GOOGLE } from './constants';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import {
	isValidCTAPlacement,
	isValidCTAPostTypes,
	isValidColorTheme,
	isValidPublicationID,
} from '../util/validation';

// Invariant error messages.
export const INVARIANT_INVALID_PUBLICATION_ID =
	'a valid publicationID is required';
export const INVARIANT_INVALID_COLOR_THEME = 'a valid color theme is required';
export const INVARIANT_INVALID_BUTTON_PLACEMENT =
	'a valid button placement is required';
export const INVARIANT_INVALID_BUTTON_POST_TYPES =
	'a valid button post types array is required';

export async function submitChanges( { select, dispatch } ) {
	// This action shouldn't be called if settings haven't changed,
	// but this prevents errors in tests.
	if ( select( MODULES_THANK_WITH_GOOGLE ).haveSettingsChanged() ) {
		const { error } = await dispatch(
			MODULES_THANK_WITH_GOOGLE
		).saveSettings();

		if ( error ) {
			return { error };
		}
	}

	await API.invalidateCache( 'modules', 'thank-with-google' );

	return {};
}

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	// Strict select will cause all selector functions to throw an error
	// if `undefined` is returned, otherwise it behaves the same as `select`.
	// This ensures that the selector returns `false` until all data dependencies are resolved.
	const {
		haveSettingsChanged,
		isDoingSubmitChanges,
		getPublicationID,
		getColorTheme,
		getCTAPlacement,
		getCTAPostTypes,
	} = strictSelect( MODULES_THANK_WITH_GOOGLE );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );

	const publicationID = getPublicationID();
	invariant(
		isValidPublicationID( publicationID ),
		INVARIANT_INVALID_PUBLICATION_ID
	);

	const colorTheme = getColorTheme();
	invariant( isValidColorTheme( colorTheme ), INVARIANT_INVALID_COLOR_THEME );

	const ctaPlacement = getCTAPlacement();
	invariant(
		isValidCTAPlacement( ctaPlacement ),
		INVARIANT_INVALID_BUTTON_PLACEMENT
	);

	const ctaPostTypes = getCTAPostTypes();
	invariant(
		isValidCTAPostTypes( ctaPostTypes ),
		INVARIANT_INVALID_BUTTON_POST_TYPES
	);
}
