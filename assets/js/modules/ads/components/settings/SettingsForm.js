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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { MODULES_ADS } from '@/js/modules/ads/datastore/constants';
import ConversionTrackingToggle from '@/js/components/conversion-tracking/ConversionTrackingToggle';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { ConversionIDTextField } from '@/js/modules/ads/components/common';
import { useFeature } from '@/js/hooks/useFeature';
import DisplaySetting from '@/js/components/DisplaySetting';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import Link from '@/js/components/Link';
import SettingsGroup from '@/js/components/settings/SettingsGroup';
import GoogleTagGatewayToggle from '@/js/components/google-tag-gateway/GoogleTagGatewayToggle';
import Typography from '@/js/components/Typography';

export default function SettingsForm() {
	const paxEnabled = useFeature( 'adsPax' );
	const gtgEnabled = useFeature( 'googleTagGateway' );

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
			'plugin-conversion-tracking'
		)
	);

	const conversionIDValue =
		paxEnabled && paxConversionID ? paxConversionID : conversionID;

	const isPaxView = paxEnabled && ( paxConversionID || extCustomerID );

	return (
		<div className="googlesitekit-ads-settings-fields">
			<StoreErrorNotices moduleSlug="ads" storeName={ MODULES_ADS } />

			{ ! isPaxView && (
				<div className="googlesitekit-setup-module__inputs">
					<ConversionIDTextField
						helperText={ __(
							'The Conversion ID will help track the performance of ad campaigns for the corresponding account',
							'google-site-kit'
						) }
					/>
				</div>
			) }

			{ isPaxView && (
				<div>
					<div className="googlesitekit-settings-module__meta-item">
						<Typography
							as="h5"
							size="small"
							type="label"
							className="googlesitekit-settings-module__meta-item-type"
						>
							{ __( 'Conversion ID', 'google-site-kit' ) }
						</Typography>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ conversionIDValue === '' &&
								__( 'None', 'google-site-kit' ) }
							{ conversionIDValue ||
								( typeof conversionIDValue === 'undefined' && (
									<DisplaySetting
										value={ conversionIDValue }
									/>
								) ) }
						</p>
					</div>
					<div className="googlesitekit-settings-module__meta-item">
						<Typography
							as="h5"
							size="medium"
							type="label"
							className="googlesitekit-settings-module__meta-item-type"
						>
							{ __( 'Customer ID', 'google-site-kit' ) }
						</Typography>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ extCustomerID === '' &&
								__( 'None', 'google-site-kit' ) }
							{ extCustomerID ||
								( typeof extCustomerID === 'undefined' && (
									<DisplaySetting value={ extCustomerID } />
								) ) }
						</p>
					</div>
				</div>
			) }

			<SettingsGroup
				title={ __( 'Improve your measurement', 'google-site-kit' ) }
			>
				<ConversionTrackingToggle>
					{ createInterpolateElement(
						__(
							'To track the performance of your campaigns, Site Kit will enable plugin conversion tracking. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ conversionTrackingDocumentationURL }
									aria-label={ __(
										'Learn more about conversion tracking',
										'google-site-kit'
									) }
									external
								/>
							),
						}
					) }
				</ConversionTrackingToggle>
				{ gtgEnabled && <GoogleTagGatewayToggle /> }
			</SettingsGroup>
		</div>
	);
}
