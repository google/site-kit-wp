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
	Fragment,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { Grid, Cell, Row } from '../../material-components';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import InfoCircle from '../../../../assets/svg/icons/info-circle.svg';
import Link from '../Link';
import SettingsNotice, { TYPE_INFO } from '../SettingsNotice';
import WPConsentAPIRequirement from './WPConsentAPIRequirement';
import Tick from '../../../svg/icons/tick.svg';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

export default function WPConsentAPIRequirements() {
	const viewContext = useViewContext();

	const wpConsentAPIDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'wp-consent-api' )
	);
	const consentManagementPlatformDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'consent-management-platform'
		)
	);

	const { hasConsentAPI, wpConsentPlugin } = useSelect( ( select ) =>
		select( CORE_SITE ).getConsentAPIInfo()
	);

	const cellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 6,
	};

	useEffect( () => {
		if ( hasConsentAPI ) {
			trackEvent( `${ viewContext }_CoMo`, 'wp_consent_api_active' );
		}
	}, [ hasConsentAPI, viewContext ] );

	return (
		<Fragment>
			<p className="googlesitekit-settings-consent-mode-requirements__description">
				{ __(
					'In order for consent mode to work properly, these requirements must be met:',
					'google-site-kit'
				) }
			</p>
			<Grid className="googlesitekit-settings-consent-mode-requirements__grid">
				<Row>
					<Cell { ...cellProps }>
						<WPConsentAPIRequirement
							title={
								wpConsentPlugin?.installed
									? __(
											'Activate WP Consent API',
											'google-site-kit'
									  )
									: __(
											'Install WP Consent API',
											'google-site-kit'
									  )
							}
							description={ createInterpolateElement(
								__(
									'WP Consent API is a plugin that standardizes the communication of accepted consent categories between plugins. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											href={
												wpConsentAPIDocumentationURL
											}
											external
											aria-label={ __(
												'Learn more about the WP Consent API',
												'google-site-kit'
											) }
											onClick={ async () => {
												await trackEvent(
													`${ viewContext }_CoMo`,
													'wp_consent_api_learn_more'
												);
											} }
										/>
									),
								}
							) }
							footer={
								<Fragment>
									{ hasConsentAPI && (
										<div className="googlesitekit-settings-consent-mode-requirement__consent-api-detected-wrapper">
											<span className="googlesitekit-settings-consent-mode-requirement__consent-api-detected-icon">
												<Tick />
											</span>
											{ __(
												'Site Kit detected WP Consent API for your site',
												'google-site-kit'
											) }
										</div>
									) }
									{ ! hasConsentAPI && (
										<Fragment>
											{ wpConsentPlugin.installed && (
												<Button
													className="googlesitekit-settings-consent-mode-requirement__install-button"
													href={
														wpConsentPlugin.activateURL
													}
													onClick={ async () => {
														await trackEvent(
															`${ viewContext }_CoMo`,
															'wp_consent_api_activate'
														);
													} }
												>
													{ __(
														'Activate',
														'google-site-kit'
													) }
												</Button>
											) }
											{ ! wpConsentPlugin.installed && (
												<Button
													className="googlesitekit-settings-consent-mode-requirement__install-button"
													href={
														wpConsentPlugin.installURL
													}
													onClick={ async () => {
														await trackEvent(
															`${ viewContext }_CoMo`,
															'wp_consent_api_install'
														);
													} }
												>
													{ __(
														'Install',
														'google-site-kit'
													) }
												</Button>
											) }
										</Fragment>
									) }
								</Fragment>
							}
						/>
					</Cell>
					<Cell { ...cellProps }>
						<WPConsentAPIRequirement
							title={ __(
								'Install consent management plugin',
								'google-site-kit'
							) }
							description={ createInterpolateElement(
								__(
									'You’ll need a plugin compatible with the WP Consent API to display a notice to site visitors and get their consent for tracking. WordPress offers a variety of consent plugins you can choose from. <a>See suggested plugins</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											href={
												consentManagementPlatformDocumentationURL
											}
											external
											aria-label={ __(
												'Suggested consent management plugins',
												'google-site-kit'
											) }
											onClick={ async () => {
												await trackEvent(
													`${ viewContext }_CoMo`,
													'consent_mgmt_plugin_learn_more'
												);
											} }
										/>
									),
								}
							) }
							footer={
								<SettingsNotice
									className="googlesitekit-settings-consent-mode-requirement__consent-management-plugin-notice"
									type={ TYPE_INFO }
									Icon={ InfoCircle }
									notice={ __(
										"Make sure you have installed a plugin compatible with WP Consent API (Site Kit isn't able to verify the compatibility of all WP plugins).",
										'google-site-kit'
									) }
								/>
							}
						/>
					</Cell>
				</Row>
			</Grid>
		</Fragment>
	);
}
