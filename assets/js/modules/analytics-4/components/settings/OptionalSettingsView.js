/**
 * Optional Settings View component.
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
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import AdsConversionIDSettingsNotice from './AdsConversionIDSettingsNotice';
import DisplaySetting from '../../../../components/DisplaySetting';
import { trackingExclusionLabels } from '../common/TrackingExclusionSwitches';

const { useSelect } = Data;

export default function OptionalSettingsView() {
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUseSnippet()
	);
	const adsConversionIDMigratedAtMs = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdsConversionIDMigratedAtMs()
	);
	const trackingDisabled = useSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getTrackingDisabled() || []
	);
	const adsConversionID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdsConversionID()
	);

	return (
		<Fragment>
			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Excluded from Analytics', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ !! trackingDisabled.length &&
							trackingDisabled
								.map(
									( exclusion ) =>
										trackingExclusionLabels[ exclusion ]
								)
								.join(
									_x(
										', ',
										'list separator',
										'google-site-kit'
									)
								) }
						{ ! trackingDisabled.length &&
							__(
								'Analytics is currently enabled for all visitors',
								'google-site-kit'
							) }
					</p>
				</div>
			</div>

			{ useSnippet && ! adsConversionIDMigratedAtMs && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Ads Conversion ID', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ !! adsConversionID && (
								<DisplaySetting value={ adsConversionID } />
							) }
							{ ! adsConversionID &&
								__( 'None', 'google-site-kit' ) }
						</p>
					</div>
				</div>
			) }

			<AdsConversionIDSettingsNotice />
		</Fragment>
	);
}
