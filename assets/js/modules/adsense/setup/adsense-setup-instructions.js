/**
 * AdSenseSetupInstructions component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import SvgIcon from 'GoogleUtil/svg-icon';
import Link from 'GoogleComponents/link';
import Button from 'GoogleComponents/button';
/**
 * Internal dependencies
 */
import AdSenseSettings from '../settings/adsense-settings';
import data, { TYPE_MODULES } from 'GoogleComponents/data';
import Spinner from 'GoogleComponents/spinner';
import { Fragment } from 'react';
import { sendAnalyticsTrackingEvent } from 'GoogleUtil';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class AdSenseSetupInstructions extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			isSaving: false,
		};
	}

	render() {
		const {
			error,
			message,
			issue,
			notice,
			statusHeadline,
			statusMessage,
			profile,
			ctaLinkText,
			ctaLink,
			footerText,
			footerAppendedText,
			footerCTA,
			footerCTALink,
			continueAction,
			continueSetup,
			accountStatus,
			accountTagMatch,
			clientID,
			existingTag,
			switchLabel,
			tracking,
			switchOffMessage,
			switchOnMessage,
			goBack,
			existingState,
		} = this.props;

		const { isSaving } = this.state;
		const { userData: { email = '', picture = '' } } = global.googlesitekit.admin;

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
				<div className="googlesitekit-setup-module__step">
					{ issue &&
						<p className="googlesitekit-setup__notice">
							<SvgIcon id="error" height="20" width="23" />
							<span className="googlesitekit-setup__notice-text">{ issue }</span>
						</p>
					}
					<h2 className="
						googlesitekit-heading-4
						googlesitekit-setup-module__title
					">
						{ statusHeadline }
					</h2>
					<p>{ statusMessage }</p>
					{ profile &&
						<p className="googlesitekit-setup-module__user">
							{
								picture &&
									<img
										className="googlesitekit-setup-module__user-image"
										src={ picture }
										alt={ __( 'User Avatar', 'google-site-kit' ) }
									/>
							}
							<span className="googlesitekit-setup-module__user-email">
								{ email }
							</span>
						</p>
					}
					{
						( 'account-connected' === accountStatus ) &&
							<AdSenseSettings
								isEditing={ true }
								accountTagMatch={ accountTagMatch }
								existingTag={ existingTag }
								saveOnChange={ true }
								switchLabel={ switchLabel }
								switchOffMessage={ switchOffMessage }
								switchOnMessage={ switchOnMessage }
							/>
					}
					{ notice &&
						<div className="googlesitekit-settings-notice">
							<div className="googlesitekit-settings-notice__text">
								{ notice }
							</div>
						</div>
					}
					{ error && 0 < message.length &&
						<div className="googlesitekit-error-text">
							<p>{ __( 'Error:', 'google-site-kit' ) } { message }</p>
						</div>
					}

					<div className="googlesitekit-setup-module__action">
						{ 'account-connected' === accountStatus &&
							<Fragment>
								<Button
									disabled={ isSaving }
									onClick={ () => {
										if ( tracking ) {
											sendAnalyticsTrackingEvent(
												tracking.eventCategory,
												tracking.eventName
											);
										}
										this.setState( { isSaving: true } );
										const enableAutoAds = document.getElementById( 'enableAutoAds' );
										const useSnippet = enableAutoAds && enableAutoAds.checked;

										// Save the publisher clientID: AdSense setup is complete!
										data.set( TYPE_MODULES, 'adsense', 'setup-complete', { clientID, useSnippet } ).then( () => {
											document.location = ctaLink;
										} ).catch( () => {
											this.setState( { isSaving: false } );
										} );
									} }
								>
									{ ctaLinkText }
								</Button>
								<Spinner isSaving={ isSaving } />
							</Fragment>
						}
						{ 'account-connected' !== accountStatus && (
							<Link
								className="googlesitekit-setup-module__cta-link"
								external
								inherit
								href={ ctaLink }
							>
								{ ctaLinkText }
							</Link>
						) }
						{
							continueAction &&
							<div className="googlesitekit-setup-module__sub-action">
								<Link
									inherit
									onClick={ () => {
										continueSetup( continueAction );
									} }
								>
									{ continueAction.continueText }
								</Link>
							</div>
						}
						{
							existingState &&
							<div className="googlesitekit-setup-module__sub-action">
								<Link
									inherit
									onClick={ () => {
										goBack();
									} }
								>
									{ __( 'Back', 'google-site-kit' ) }
								</Link>
							</div>
						}
					</div>

					{ footerText &&
						<p className="googlesitekit-setup-module__footer-text">
							{ footerText } { footerCTA && <Link href={ footerCTALink } inherit external>{ footerCTA }</Link> } { footerAppendedText }
						</p>
					}
				</div>
			</div>
		);
	}
}

export default AdSenseSetupInstructions;
