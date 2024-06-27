/**
 * SettingsForm component.
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
import { __ } from '@wordpress/i18n';
import { Fragment, createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { MODULES_ADS } from '../../datastore/constants';
import ConversionTrackingToggle from '../../../../components/conversion-tracking/ConversionTrackingToggle';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { ConversionIDTextField } from '../common';
import { useFeature } from '../../../../hooks/useFeature';
import DisplaySetting from '../../../../components/DisplaySetting';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import Link from '../../../../components/Link';

export default function SettingsForm() {
	const iceEnabled = useFeature( 'conversionInfra' );
	const paxEnabled = useFeature( 'adsPax' );

	const conversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getConversionID()
	);

	const paxConversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getPaxConversionID()
	);

	const extCustomerID = useSelect( ( select ) =>
		select( MODULES_ADS ).getExtCustomerID()
	);

	const conversionTrackingDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'enhanced-conversion-tracking'
		)
	);

	const conversionIDValue =
		paxEnabled && paxConversionID ? paxConversionID : conversionID;

	const isPaxView = paxEnabled && ( paxConversionID || extCustomerID );

	return (
		<Fragment>
			<div className="googlesitekit-ads-settings-fields">
				<StoreErrorNotices moduleSlug="ads" storeName={ MODULES_ADS } />

				{ iceEnabled && (
					<div className="googlesitekit-settings-module__meta-item">
						<ConversionTrackingToggle>
							{ createInterpolateElement(
								__(
									'Conversion tracking allows you to measure additional events on your site from other plugins that Site Kit integrates with to optimize your campaign performance. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											href={
												conversionTrackingDocumentationURL
											}
											external
											aria-label={ __(
												'Learn more about conversion tracking',
												'google-site-kit'
											) }
										/>
									),
								}
							) }
						</ConversionTrackingToggle>
					</div>
				) }

				{ ! isPaxView && (
					<div className="googlesitekit-setup-module__inputs">
						<ConversionIDTextField
							helperText={ __(
								'The Conversion Tracking ID will help track the performance of ad campaigns for the corresponding account',
								'google-site-kit'
							) }
						/>
					</div>
				) }

				{ isPaxView && (
					<div>
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __(
									'Conversion Tracking ID',
									'google-site-kit'
								) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								{ conversionIDValue === '' &&
									__( 'None', 'google-site-kit' ) }
								{ conversionIDValue ||
									( typeof conversionIDValue ===
										'undefined' && (
										<DisplaySetting
											value={ conversionIDValue }
										/>
									) ) }
							</p>
						</div>
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __( 'Customer ID', 'google-site-kit' ) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								{ extCustomerID === '' &&
									__( 'None', 'google-site-kit' ) }
								{ extCustomerID ||
									( typeof extCustomerID === 'undefined' && (
										<DisplaySetting
											value={ extCustomerID }
										/>
									) ) }
							</p>
						</div>
					</div>
				) }
			</div>
		</Fragment>
	);
}
