/**
 * AdBlockingRecoveryToggle component.
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
 * External dependencies
 */
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import {
	AD_BLOCKING_FORM_SETTINGS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import Link from '../../../../components/Link';
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import { useFeature } from '../../../../hooks/useFeature';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
const { useSelect, useDispatch } = Data;

export default function AdBlockingRecoveryToggle() {
	const adBlockerDetectionEnabled = useFeature( 'adBlockerDetection' );

	const adBlockingDetectionSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockerDetectionSnippet()
	);
	const adBlockingDetectionErrorSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockerDetectionErrorSnippet()
	);
	const adBlockingRecoverySetupStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus()
	);
	const adsenseAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const privacyMessagingURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceURL( {
			path: `/${ adsenseAccountID }/privacymessaging/ad_blocking`,
		} )
	);
	const adBlockingDetectionToggle = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AD_BLOCKING_FORM_SETTINGS,
			'adBlockerDetectionToggle'
		)
	);
	const adBlockingDetectionErrorToggle = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AD_BLOCKING_FORM_SETTINGS,
			'adBlockerDetectionErrorToggle'
		)
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const {
		setUseAdBlockerDetectionSnippet,
		setUseAdBlockerDetectionErrorSnippet,
	} = useDispatch( MODULES_ADSENSE );

	const handleDetectionToggleClick = () => {
		setValues( AD_BLOCKING_FORM_SETTINGS, {
			adBlockerDetectionToggle: ! adBlockingDetectionToggle,
		} );
		setUseAdBlockerDetectionSnippet( ! adBlockingDetectionToggle );
	};

	const handleErrorToggleClick = () => {
		setValues( AD_BLOCKING_FORM_SETTINGS, {
			adBlockerDetectionErrorToggle: ! adBlockingDetectionErrorToggle,
		} );
		setUseAdBlockerDetectionErrorSnippet(
			! adBlockingDetectionErrorToggle
		);
	};

	useMount( () => {
		const initialToggleValues = {
			// Set the initial toggle value to `undefined` if the saved value is `false`
			// to prevent the SettingsNotice from showing up on mount.
			adBlockerDetectionToggle: adBlockingDetectionSnippet || undefined,
			adBlockerDetectionErrorToggle: adBlockingDetectionErrorSnippet,
		};

		setValues( AD_BLOCKING_FORM_SETTINGS, initialToggleValues );
	} );

	if ( ! adBlockerDetectionEnabled || ! adBlockingRecoverySetupStatus ) {
		return null;
	}

	return (
		<fieldset className="googlesitekit-settings-module__ad-blocking-recovery-toggles">
			<legend className="googlesitekit-setup-module__text">
				{ __( 'Ad blocking recovery', 'google-site-kit' ) }
			</legend>
			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<Switch
						label={ __(
							'Place ad blocking recovery tag',
							'google-site-kit'
						) }
						checked={ adBlockingDetectionToggle }
						onClick={ handleDetectionToggleClick }
						hideLabel={ false }
					/>
					<p>
						{ createInterpolateElement(
							__(
								'Ad blocking recovery only works if you’ve also created and published a recovery message in AdSense. <a>Configure your message</a>',
								'google-site-kit'
							),
							{
								a: (
									<Link
										href={ privacyMessagingURL }
										external
									/>
								),
							}
						) }
					</p>
				</div>
				{ ( adBlockingDetectionToggle ||
					adBlockingDetectionSnippet ) && (
					<div className="googlesitekit-settings-module__meta-item">
						<Switch
							label={ __(
								'Place error protection tag',
								'google-site-kit'
							) }
							checked={ adBlockingDetectionErrorToggle }
							onClick={ handleErrorToggleClick }
							hideLabel={ false }
						/>
						<p>
							{ __(
								'If a site visitor’s ad blocker browser extension also blocks the standard ad blocking recovery tag, the error protection tag will show a non-customizable ad blocking recovery message to visitors when enabled.',
								'google-site-kit'
							) }
						</p>
					</div>
				) }
			</div>
			{ adBlockingDetectionToggle === false && (
				<SettingsNotice
					notice={ __(
						'The ad blocking recovery message won’t be displayed to visitors unless the tag is placed',
						'google-site-kit'
					) }
				/>
			) }
		</fieldset>
	);
}
