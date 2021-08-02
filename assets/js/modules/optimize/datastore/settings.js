/**
 * `modules/optimize` data store: settings.
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
import { MODULES_OPTIMIZE } from './constants';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import { isValidOptimizeID, isValidAMPExperimentJSON } from '../util';

// Invariant error messages.
export const INVARIANT_INVALID_AMP_EXPERIMENT_JSON =
	'ampExperimentJSON must be valid JSON if set';
export const INVARIANT_INVALID_OPTIMIZE_ID = 'a valid optimizeID is required';

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	const {
		getOptimizeID,
		getAMPExperimentJSON,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( MODULES_OPTIMIZE );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );

	const ampExperimentJSON = getAMPExperimentJSON();
	invariant(
		isValidAMPExperimentJSON( ampExperimentJSON ),
		INVARIANT_INVALID_AMP_EXPERIMENT_JSON
	);

	const optimizeID = getOptimizeID();
	invariant(
		'' === optimizeID || isValidOptimizeID( optimizeID ),
		INVARIANT_INVALID_OPTIMIZE_ID
	);
}
