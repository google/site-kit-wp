/**
 * `modules/reader-revenue-manager` data store: settings actions.
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
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import {
	isValidPublicationID,
	isValidOnboardingState,
} from '../utils/validation';

// Invariant error messages.
export const INVARIANT_INVALID_PUBLICATION_ID =
	'a valid publicationID is required';

export const INVARIANT_INVALID_PUBLICATION_ONBOARDING_STATE =
	'a valid publication onboarding state is required';

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	// Strict select will cause all selector functions to throw an error
	// if `undefined` is returned, otherwise it behaves the same as `select`.
	// This ensures that the selector returns `false` until all data dependencies are resolved.
	const {
		haveSettingsChanged,
		isDoingSubmitChanges,
		getPublicationID,
		getPublicationOnboardingState,
	} = strictSelect( MODULES_READER_REVENUE_MANAGER );

	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );

	const publicationID = getPublicationID();
	const onboardingState = getPublicationOnboardingState();
	invariant(
		isValidPublicationID( publicationID ),
		INVARIANT_INVALID_PUBLICATION_ID
	);

	invariant(
		isValidOnboardingState( onboardingState ),
		INVARIANT_INVALID_PUBLICATION_ONBOARDING_STATE
	);
}
