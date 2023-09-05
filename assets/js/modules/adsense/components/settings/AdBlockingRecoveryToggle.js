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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import Link from '../../../../components/Link';
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import {
	AD_BLOCKING_FORM_SETTINGS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import { parseAccountIDFromExistingTag } from '../../util';
const { useSelect, useDispatch } = Data;

export default function AdBlockingRecoveryToggle() {
	const viewContext = useViewContext();

	const adBlockingRecoverySnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockingRecoverySnippet()
	);
	const adBlockingRecoveryErrorSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockingRecoveryErrorSnippet()
	);
	const adBlockingRecoverySetupStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus()
	);
	const existingAdBlockingRecoveryTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingAdBlockingRecoveryTag()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const privacyMessagingURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceURL( {
			path: `/${ accountID }/privacymessaging/ad_blocking`,
		} )
	);
	const learnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ad-blocking-recovery' )
	);
	const adBlockingRecoveryToggle = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AD_BLOCKING_FORM_SETTINGS,
			'adBlockingRecoveryToggle'
		)
	);
	const adBlockingRecoveryErrorToggle = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AD_BLOCKING_FORM_SETTINGS,
			'adBlockingRecoveryErrorToggle'
		)
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const {
		setUseAdBlockingRecoverySnippet,
		setUseAdBlockingRecoveryErrorSnippet,
	} = useDispatch( MODULES_ADSENSE );

	const handleAdBlockingRecoveryToggleClick = () => {
		const toggleValue = ! adBlockingRecoveryToggle;
		setValues( AD_BLOCKING_FORM_SETTINGS, {
			adBlockingRecoveryToggle: toggleValue,
		} );
		setUseAdBlockingRecoverySnippet( toggleValue );

		trackEvent(
			`${ viewContext }_adsense-abr`,
			toggleValue ? 'enable_tag' : 'disable_tag',
			'abr_tag'
		);
	};

	const handleErrorProtectionToggleClick = () => {
		const toggleValue = ! adBlockingRecoveryErrorToggle;
		setValues( AD_BLOCKING_FORM_SETTINGS, {
			adBlockingRecoveryErrorToggle: toggleValue,
		} );
		setUseAdBlockingRecoveryErrorSnippet( toggleValue );

		trackEvent(
			`${ viewContext }_adsense-abr`,
			toggleValue ? 'enable_tag' : 'disable_tag',
			'error_protection_tag'
		);
	};

	useMount( () => {
		const initialToggleValues = {
			adBlockingRecoveryToggle: adBlockingRecoverySnippet,
			adBlockingRecoveryErrorToggle: adBlockingRecoveryErrorSnippet,
		};

		setValues( AD_BLOCKING_FORM_SETTINGS, initialToggleValues );
	} );

	let existingAdBlockingRecoveryTagMessage;
	if (
		existingAdBlockingRecoveryTag &&
		existingAdBlockingRecoveryTag === accountID
	) {
		existingAdBlockingRecoveryTagMessage = __(
			'You’ve already enabled an ad blocking recovery message on your site. We recommend using Site Kit to manage this to get the most out of AdSense.',
			'google-site-kit'
		);
	} else if ( existingAdBlockingRecoveryTag ) {
		existingAdBlockingRecoveryTagMessage = sprintf(
			/* translators: %s: account ID */
			__(
				'Site Kit detected Ad Blocking Recovery code for a different account %s on your site. For a better ad blocking recovery experience, you should remove Ad Blocking Recovery code that’s not linked to this AdSense account.',
				'google-site-kit'
			),
			parseAccountIDFromExistingTag( existingAdBlockingRecoveryTag )
		);
	}

	if ( ! adBlockingRecoverySetupStatus ) {
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
							'Enable ad blocking recovery message',
							'google-site-kit'
						) }
						checked={ adBlockingRecoveryToggle }
						onClick={ handleAdBlockingRecoveryToggleClick }
						hideLabel={ false }
					/>
					<p>
						{ createInterpolateElement(
							__(
								'Identify site visitors that have an ad blocker browser extension installed. These site visitors will see the ad blocking recovery message created in AdSense. <a>Configure your message</a>',
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
				{ ( adBlockingRecoveryToggle || adBlockingRecoverySnippet ) && (
					<div className="googlesitekit-settings-module__meta-item">
						<Switch
							label={ __(
								'Place error protection code',
								'google-site-kit'
							) }
							checked={ adBlockingRecoveryErrorToggle }
							onClick={ handleErrorProtectionToggleClick }
							hideLabel={ false }
						/>
						<p>
							{ createInterpolateElement(
								__(
									'If a site visitor’s ad blocker browser extension blocks the message you create in AdSense, a default, non-customizable ad blocking recovery message will display instead. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: <Link href={ learnMoreURL } external />,
								}
							) }
						</p>
					</div>
				) }
			</div>
			{ existingAdBlockingRecoveryTag && (
				<SettingsNotice
					notice={ existingAdBlockingRecoveryTagMessage }
				/>
			) }
		</fieldset>
	);
}
