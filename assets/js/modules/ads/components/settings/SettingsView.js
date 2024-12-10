/**
 * Ads Settings View component
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { MODULES_ADS } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import DisplaySetting from '../../../../components/DisplaySetting';
import AdBlockerWarning from '../../../../components/notifications/AdBlockerWarning';
import { useFeature } from './../../../../hooks/useFeature';
import SettingsStatuses from '../../../../components/settings/SettingsStatuses';

export default function SettingsView() {
	const paxEnabled = useFeature( 'adsPax' );
	const fpmEnabled = useFeature( 'firstPartyMode' );

	const conversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getConversionID()
	);

	const paxConversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getPaxConversionID()
	);

	const extCustomerID = useSelect( ( select ) =>
		select( MODULES_ADS ).getExtCustomerID()
	);

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	const conversionIDValue =
		paxEnabled && paxConversionID ? paxConversionID : conversionID;

	const isPaxView = paxEnabled && ( paxConversionID || extCustomerID );

	const isConversionTrackingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConversionTrackingEnabled()
	);

	const isFPMEnabled = useSelect( ( select ) => {
		const { isFirstPartyModeEnabled, isFPMHealthy, isScriptAccessEnabled } =
			select( CORE_SITE );

		return isFirstPartyModeEnabled && isFPMHealthy && isScriptAccessEnabled;
	} );

	return (
		<div className="googlesitekit-setup-module">
			<div
				className={ classnames( {
					'googlesitekit-settings-module__meta-item':
						isAdBlockerActive,
				} ) }
			>
				<AdBlockerWarning moduleSlug="ads" />
			</div>

			<SettingsStatuses
				statuses={
					fpmEnabled
						? [
								{
									label: __(
										'Enhanced Conversion Tracking',
										'google-site-kit'
									),
									status: isConversionTrackingEnabled,
								},
								{
									label: __(
										'First-party Mode',
										'google-site-kit'
									),
									status: isFPMEnabled,
								},
						  ]
						: [
								{
									label: __(
										'Conversion Tracking',
										'google-site-kit'
									),
									status: isConversionTrackingEnabled,
								},
						  ]
				}
			/>

			{ ! isAdBlockerActive && (
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Conversion Tracking ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ conversionIDValue === '' &&
							__( 'None', 'google-site-kit' ) }
						{ conversionIDValue ||
							( typeof conversionIDValue === 'undefined' && (
								<DisplaySetting value={ conversionIDValue } />
							) ) }
					</p>
				</div>
			) }

			{ ! isAdBlockerActive && isPaxView && (
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Customer ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ extCustomerID === '' &&
							__( 'None', 'google-site-kit' ) }
						{ extCustomerID ||
							( typeof extCustomerID === 'undefined' && (
								<DisplaySetting value={ extCustomerID } />
							) ) }
					</p>
				</div>
			) }
		</div>
	);
}
