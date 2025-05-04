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
import {
	createInterpolateElement,
	useState,
	Fragment,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import ErrorText from '../../components/ErrorText';
import Link from '../Link';
import LoadingWrapper from '../LoadingWrapper';
import ConfirmDisableConsentModeDialog from './ConfirmDisableConsentModeDialog';
import { DAY_IN_SECONDS, trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';

export default function ConsentModeSwitch( { loading } ) {
	const viewContext = useViewContext();

	const [ saveError, setSaveError ] = useState( null );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const isConsentModeEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConsentModeEnabled()
	);

	const consentModeDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'consent-mode' )
	);

	const isSaving = useSelect( ( select ) =>
		select( CORE_SITE ).isFetchingSaveConsentModeSettings()
	);

	const { setConsentModeEnabled, saveConsentModeSettings } =
		useDispatch( CORE_SITE );

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);
	const { dismissPrompt, triggerSurvey } = useDispatch( CORE_USER );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed(
			CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
		)
	);

	async function saveSettings() {
		setSaveError( null );

		const promises = [ saveConsentModeSettings() ];

		if ( usingProxy ) {
			promises.push(
				triggerSurvey( 'enable_como', { ttl: DAY_IN_SECONDS } )
			);
		}

		const [ { error } ] = await Promise.all( promises );

		if ( error ) {
			setSaveError( error );
			return;
		}

		if ( ! isDismissed ) {
			await dismissPrompt( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG );
		}
	}

	return (
		<Fragment>
			<div>
				{
					<LoadingWrapper
						loading={ loading }
						width="180px"
						height="21.3px"
					>
						<Switch
							label={ __(
								'Enable consent mode',
								'google-site-kit'
							) }
							checked={ isConsentModeEnabled }
							disabled={ loading || isSaving }
							onClick={ () => {
								// If Consent Mode is currently enabled, show a confirmation
								// dialog warning users about the impact of disabling it.
								if ( isConsentModeEnabled ) {
									trackEvent(
										`${ viewContext }_CoMo`,
										'como_disable'
									);

									setShowConfirmDialog( true );
								} else {
									trackEvent(
										`${ viewContext }_CoMo`,
										'como_enable'
									);

									// Consent Mode is not currently enabled, so this toggle
									// enables it.
									setConsentModeEnabled( true );
									saveSettings();
								}
							} }
							hideLabel={ false }
						/>
					</LoadingWrapper>
				}
				{ saveError && <ErrorText message={ saveError.message } /> }
				{ ! loading && isConsentModeEnabled && (
					<p className="googlesitekit-settings-consent-mode-switch__enabled-notice">
						{ __(
							'Site Kit added the necessary code to your tag to comply with Consent Mode.',
							'google-site-kit'
						) }
					</p>
				) }
				{
					<LoadingWrapper
						className="googlesitekit-settings-consent-mode-switch-description--loading"
						loading={ loading }
						width="750px"
						height="42px"
						smallWidth="386px"
						smallHeight="84px"
						tabletWidth="540px"
						tabletHeight="84px"
					>
						<p>
							{ createInterpolateElement(
								__(
									'Consent mode will help adjust tracking on your site, so only visitors who have explicitly given consent are tracked. <br />This is required in some parts of the world, like the European Economic Area. <a>Learn more</a>',
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
											onClick={ async () => {
												await trackEvent(
													`${ viewContext }_CoMo`,
													'como_learn_more'
												);
											} }
										/>
									),
								}
							) }
						</p>
					</LoadingWrapper>
				}
			</div>
			{ showConfirmDialog && (
				<ConfirmDisableConsentModeDialog
					onConfirm={ () => {
						trackEvent(
							`${ viewContext }_CoMo`,
							'confirm_disconnect'
						);

						setConsentModeEnabled( false );
						setShowConfirmDialog( false );
						saveSettings();
					} }
					onCancel={ () => {
						trackEvent(
							`${ viewContext }_CoMo`,
							'cancel_disconnect'
						);

						setShowConfirmDialog( false );
					} }
				/>
			) }
		</Fragment>
	);
}
