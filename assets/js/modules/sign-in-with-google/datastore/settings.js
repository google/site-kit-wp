/**
 * `modules/sign-in-with-google` data store: settings.
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
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import {
	MODULES_SIGN_IN_WITH_GOOGLE,
	SIGN_IN_WITH_GOOGLE_SHAPES,
	SIGN_IN_WITH_GOOGLE_TEXTS,
	SIGN_IN_WITH_GOOGLE_THEMES,
} from './constants';
import { isValidClientID } from '../utils/validation';

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );

	// Strict select will cause all selector functions to throw an error
	// if `undefined` is returned, otherwise it behaves the same as `select`.
	// This ensures that the selector returns `false` until all data dependencies
	// are resolved.
	const {
		getClientID,
		getShape,
		getText,
		getTheme,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( MODULES_SIGN_IN_WITH_GOOGLE );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );

	const clientID = getClientID();
	const shape = getShape();
	const text = getText();
	const theme = getTheme();

	invariant( clientID?.length, 'clientID is required' );
	invariant( isValidClientID( clientID ), 'Invalid client ID' );
	invariant(
		SIGN_IN_WITH_GOOGLE_SHAPES.includes( shape ),
		`shape must be one of: ${ SIGN_IN_WITH_GOOGLE_SHAPES.join( ', ' ) }`
	);
	invariant(
		SIGN_IN_WITH_GOOGLE_TEXTS.includes( text ),
		`text must be one of: ${ SIGN_IN_WITH_GOOGLE_TEXTS.join( ', ' ) }`
	);
	invariant(
		SIGN_IN_WITH_GOOGLE_THEMES.includes( theme ),
		`theme must be one of: ${ SIGN_IN_WITH_GOOGLE_THEMES.join( ', ' ) }`
	);
}
