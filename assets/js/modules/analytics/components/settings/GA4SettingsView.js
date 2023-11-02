/**
 * GA4 Settings View component.
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
import { createInterpolateElement, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../../analytics-4/datastore/constants';
import Link from '../../../../components/Link';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { useFeature } from '../../../../hooks/useFeature';
import SettingsEnhancedMeasurementView from '../../../analytics-4/components/settings/SettingsEnhancedMeasurementView';
const { useSelect } = Data;

export default function GA4SettingsView() {
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );
	const enhancedMeasurementEnabled = useFeature( 'enhancedMeasurement' );

	const ga4PropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const ga4MeasurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const useGA4Snippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUseSnippet()
	);
	const editDataStreamSettingsURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getServiceEntityAccessURL()
	);
	const googleTagID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getGoogleTagID()
	);

	if ( ! ga4PropertyID || ga4PropertyID === PROPERTY_CREATE ) {
		return null;
	}

	return (
		<Fragment>
			<div className="googlesitekit-settings-module__meta-items">
				{ ga4ReportingEnabled && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Account', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ accountID } />
						</p>
					</div>
				) }
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __(
							'Google Analytics 4 Property',
							'google-site-kit'
						) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ ga4PropertyID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ createInterpolateElement(
							__(
								'<VisuallyHidden>Google Analytics 4</VisuallyHidden> Measurement ID',
								'google-site-kit'
							),
							{
								VisuallyHidden: <VisuallyHidden />,
							}
						) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ ga4MeasurementID } />
					</p>
				</div>
				{ googleTagID && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Google Tag ID', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ googleTagID } />
						</p>
					</div>
				) }
				<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
					<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
						<Link href={ editDataStreamSettingsURL } external>
							{ createInterpolateElement(
								__(
									'Edit <VisuallyHidden>Google Analytics 4 web data stream </VisuallyHidden>in Analytics',
									'google-site-kit'
								),
								{
									VisuallyHidden: <VisuallyHidden />,
								}
							) }
						</Link>
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __(
							'Google Analytics 4 Code Snippet',
							'google-site-kit'
						) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ useGA4Snippet && (
							<span>
								{ __(
									'Snippet is inserted',
									'google-site-kit'
								) }
							</span>
						) }
						{ ! useGA4Snippet && (
							<span>
								{ __(
									'Snippet is not inserted',
									'google-site-kit'
								) }
							</span>
						) }
					</p>
				</div>
			</div>

			{ enhancedMeasurementEnabled && (
				<SettingsEnhancedMeasurementView />
			) }
		</Fragment>
	);
}
