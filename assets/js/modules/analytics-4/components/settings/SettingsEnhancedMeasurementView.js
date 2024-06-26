/**
 * SettingsEnhancedMeasurementView component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import DisplaySetting from '../../../../components/DisplaySetting';
import { ProgressBar } from 'googlesitekit-components';
import {
	isValidPropertyID,
	isValidWebDataStreamID,
} from '../../utils/validation';

export default function SettingsEnhancedMeasurementView() {
	const ga4PropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);

	const isEnhancedMeasurementStreamEnabled = useSelect( ( select ) => {
		if (
			! isValidPropertyID( ga4PropertyID ) ||
			! isValidWebDataStreamID( webDataStreamID )
		) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).isEnhancedMeasurementStreamEnabled(
			ga4PropertyID,
			webDataStreamID
		);
	} );

	return (
		<div className="googlesitekit-settings-module__meta-items">
			<div className="googlesitekit-settings-module__meta-item">
				<h5 className="googlesitekit-settings-module__meta-item-type">
					{ __( 'Enhanced Measurement', 'google-site-kit' ) }
				</h5>
				{ undefined === isEnhancedMeasurementStreamEnabled && (
					<ProgressBar
						small
						className="googlesitekit-analytics-enable-enhanced-measurement__progress--settings-view"
					/>
				) }
				<p className="googlesitekit-settings-module__meta-item-data">
					<span>
						{ true === isEnhancedMeasurementStreamEnabled && (
							<DisplaySetting
								value={ __( 'Enabled', 'google-site-kit' ) }
							/>
						) }
						{ false === isEnhancedMeasurementStreamEnabled && (
							<DisplaySetting
								value={ __( 'Disabled', 'google-site-kit' ) }
							/>
						) }
						{ null === isEnhancedMeasurementStreamEnabled && (
							<DisplaySetting value={ null } />
						) }
					</span>
				</p>
			</div>
		</div>
	);
}
