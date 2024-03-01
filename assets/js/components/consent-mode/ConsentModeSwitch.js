/**
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Link from '../Link';

const { useDispatch, useSelect } = Data;

export default function ConsentModeSwitch() {
	const isConsentModeEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConsentModeEnabled()
	);

	const consentModeDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'consent-mode' )
	);

	const isLoading = useSelect( ( select ) => {
		const {
			isResolving,
			hasFinishedResolution,
			isFetchingSaveConsentModeSettings,
		} = select( CORE_SITE );

		return (
			! hasFinishedResolution( 'getConsentModeSettings' ) ||
			isResolving( 'getConsentModeSettings' ) ||
			isFetchingSaveConsentModeSettings()
		);
	} );

	const { setConsentModeEnabled, saveConsentModeSettings } =
		useDispatch( CORE_SITE );

	return (
		<div>
			<Switch
				label={ __( 'Enable consent mode', 'google-site-kit' ) }
				checked={ isConsentModeEnabled }
				disabled={ isLoading }
				onClick={ () => {
					setConsentModeEnabled( ! isConsentModeEnabled );
					saveConsentModeSettings();
				} }
				hideLabel={ false }
			/>
			{ isConsentModeEnabled && (
				<p className="googlesitekit-settings-consent-mode-switch__enabled-notice">
					{ __(
						'Site Kit added the necessary code to your tag to comply with Consent Mode.',
						'google-site-kit'
					) }
				</p>
			) }
			<p className="googlesitekit-settings-consent-mode-switch__description">
				{ createInterpolateElement(
					__(
						'Consent mode will help adjust tracking on your site, so only visitors who have explicitly given consent are tracked.<br />This is required in some parts of the world, like the European Economic Area. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						br: <br />,
						a: (
							<Link
								href={ consentModeDocumentationURL }
								external
								aria-label={ __(
									'Learn more about consent mode',
									'google-site-kit'
								) }
							/>
						),
					}
				) }
			</p>
		</div>
	);
}
