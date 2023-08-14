/**
 * Optimize Settings form.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { isValidOptimizeID } from '../../util';
import ErrorText from '../../../../components/ErrorText';
import {
	AMPExperimentJSONField,
	OptimizeIDField,
	UseSnippetInstructions,
	OptimizeIDFieldInstructions,
	PlaceAntiFlickerSwitch,
	AnalyticsNotice,
	OptimizeSunsetNotice,
} from '../common/';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
const { useSelect } = Data;

export default function SettingsForm() {
	const optimizeID = useSelect( ( select ) =>
		select( MODULES_OPTIMIZE ).getOptimizeID()
	);

	return (
		<div className="googlesitekit-optimize-settings-fields">
			<OptimizeSunsetNotice />
			<StoreErrorNotices
				moduleSlug="optimize"
				storeName={ MODULES_OPTIMIZE }
			/>
			<OptimizeIDFieldInstructions />

			<div className="googlesitekit-setup-module__inputs">
				<OptimizeIDField />
			</div>

			{ ! isValidOptimizeID( optimizeID ) && optimizeID && (
				<ErrorText
					message={ __(
						'Not a valid Optimize Container ID.',
						'google-site-kit'
					) }
				/>
			) }

			<AnalyticsNotice />

			<PlaceAntiFlickerSwitch />

			<AMPExperimentJSONField />

			<UseSnippetInstructions />
		</div>
	);
}
