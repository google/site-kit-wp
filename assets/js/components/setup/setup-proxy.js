/**
 * Setup component.
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
import punycode from 'punycode';
import { delay } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { trackEvent, getSiteKitAdminURL } from '../../util';
import Header from '../header';
import Button from '../button';
import ResetButton from '../reset-button';
import Layout from '../layout/layout';
import Notification from '../notifications/notification';
import OptIn from '../optin';
import CompatibilityChecks from './compatibility-checks';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
const { withSelect } = Data;

class SetupUsingProxy extends Component {
	constructor( props ) {
		super( props );

		// @TODO: this needs to be migrated to the core/site datastore in the future
		const { errorMessage } = global._googlesitekitLegacyData.setup;
		const { canSetup } = global._googlesitekitLegacyData.permissions;

		this.state = {
			canSetup,
			errorMessage,
			completeSetup: false,
			resetSuccess: getQueryArg( location.href, 'notification' ) === 'reset_success',
			context: getQueryArg( location.href, 'googlesitekit_context' ),
		};
	}

	isSetupFinished() {
		const { completeSetup } = this.state;
		const { isConnected } = this.props;

		return isConnected && completeSetup;
	}

	render() {
		if ( this.isSetupFinished() ) {
			const redirectURL = getSiteKitAdminURL(
				'googlesitekit-dashboard',
				{
					notification: 'authentication_success',
				},
			);

			delay( () => {
				global.location.replace( redirectURL );
			}, 500, 'later' );
		}

		const {
			context,
			errorMessage,
			resetSuccess,
		} = this.state;

		const {
			proxySetupURL,
			isResettable,
			hasConnectedAdmins,
			siteURL,
		} = this.props;

		const isRevoked = 'revoked' === context;
		const isSecondAdmin = hasConnectedAdmins;

		let title;
		let description;
		let startSetupText;

		if ( isRevoked ) {
			title = sprintf(
				/* translators: %s is the site's hostname. (e.g. example.com) */
				__( 'You revoked access to Site Kit for %s', 'google-site-kit' ),
				punycode.toUnicode( ( new URL( siteURL ) ).hostname )
			);
			description = __( 'Site Kit will no longer have access to your account. If you’d like to reconnect Site Kit, click "Start Setup" below to generate new credentials.', 'google-site-kit' );
			startSetupText = __( 'Sign in with Google', 'google-site-kit' );
		} else if ( isSecondAdmin ) {
			title = __( 'Connect your Google account to Site Kit', 'google-site-kit' );
			description = __( 'Site Kit has already been configured by another admin of this site. To use Site Kit as well, sign in with your Google account which has access to Google services for this site (e.g. Google Analytics). Once you complete the 3 setup steps, you’ll see stats from all activated Google products.', 'google-site-kit' );
			startSetupText = __( 'Sign in with Google', 'google-site-kit' );
		} else {
			title = __( 'Sign in with Google to set up Site Kit', 'google-site-kit' );
			description = __( 'The Site Kit service will guide you through 3 simple setup steps.', 'google-site-kit' );
			startSetupText = __( 'Start setup', 'google-site-kit' );
		}

		const onButtonClick = async ( event ) => {
			event.preventDefault();
			await trackEvent( 'plugin_setup', 'proxy_start_setup_landing_page' );
			global.location.assign( proxySetupURL );
		};

		return (
			<Fragment>
				<Header />
				{ errorMessage && (
					<Notification
						id="setup_error"
						type="win-error"
						title={ __( 'Oops! There was a problem during set up. Please try again.', 'google-site-kit' ) }
						description={ errorMessage }
						isDismissable={ false }
					/>
				) }
				{ resetSuccess && (
					<Notification
						id="reset_success"
						title={ __( 'Site Kit by Google was successfully reset.', 'google-site-kit' ) }
						isDismissable={ false }
					/>
				) }
				<div className="googlesitekit-wizard">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
								<Layout>
									<section className="googlesitekit-wizard-progress">
										<div className="googlesitekit-setup__footer">
											<div className="mdc-layout-grid">
												<div className="mdc-layout-grid__inner">
													<div className="
														mdc-layout-grid__cell
														mdc-layout-grid__cell--span-12
													">
														<h1 className="googlesitekit-setup__title">
															{ title }
														</h1>
														<p className="googlesitekit-setup__description">
															{ description }
														</p>

														<CompatibilityChecks>
															{ ( { complete, inProgressFeedback, CTAFeedback } ) => (
																<Fragment>
																	{ CTAFeedback }

																	<OptIn optinAction="analytics_optin_setup_fallback" />

																	<div className="googlesitekit-start-setup-wrap">
																		<Button
																			className="googlesitekit-start-setup"
																			href={ proxySetupURL }
																			onClick={ onButtonClick }
																			disabled={ ! complete }
																		>
																			{ startSetupText }
																		</Button>
																		{ inProgressFeedback }
																		{ ! isSecondAdmin && isResettable && <ResetButton /> }
																	</div>
																</Fragment>
															) }
														</CompatibilityChecks>
													</div>
												</div>
											</div>
										</div>
									</section>
								</Layout>
							</div>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default withSelect( ( select ) => {
	const store = select( CORE_SITE );

	return {
		hasConnectedAdmins: store.hasConnectedAdmins(),
		isConnected: store.isConnected(),
		isResettable: store.isResettable(),
		siteURL: store.getReferenceSiteURL(),
		proxySetupURL: store.getProxySetupURL(),
	};
} )( SetupUsingProxy );
