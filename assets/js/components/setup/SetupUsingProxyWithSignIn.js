/**
 * SetupUsingProxyWithSignIn component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg, addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { VIEW_CONTEXT_DASHBOARD_SPLASH } from '../../googlesitekit/constants';
import WelcomeSVG from '../../../svg/graphics/welcome.svg';
import WelcomeAnalyticsSVG from '../../../svg/graphics/welcome-analytics.svg';
import { trackEvent, untrailingslashit } from '../../util';
import Header from '../Header';
import Button from '../Button';
import ResetButton from '../ResetButton';
import Layout from '../layout/Layout';
import BannerNotification from '../notifications/BannerNotification';
import OptIn from '../OptIn';
import CompatibilityChecks from './CompatibilityChecks';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { Grid, Row, Cell } from '../../material-components';
import {
	ANALYTICS_NOTICE_FORM_NAME,
	ANALYTICS_NOTICE_CHECKBOX,
} from './constants';
import HelpMenu from '../help/HelpMenu';
import ActivateAnalyticsNotice from './ActivateAnalyticsNotice';
import { useFeature } from '../../hooks/useFeature';
import Link from '../Link';
const { useSelect, useDispatch } = Data;

export default function SetupUsingProxyWithSignIn() {
	const dashboardSharingEnabled = useFeature( 'dashboardSharing' );

	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const connectAnalytics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			ANALYTICS_NOTICE_FORM_NAME,
			ANALYTICS_NOTICE_CHECKBOX
		)
	);
	const {
		isSecondAdmin,
		isResettable,
		siteURL,
		proxySetupURL,
		disconnectedReason,
		isConnected,
		connectedProxyURL,
		homeURL,
	} = useSelect( ( select ) => {
		const site = select( CORE_SITE );
		const user = select( CORE_USER );

		return {
			isSecondAdmin: site.hasConnectedAdmins(),
			isResettable: site.isResettable(),
			siteURL: site.getReferenceSiteURL(),
			proxySetupURL: site.getProxySetupURL(),
			disconnectedReason: user.getDisconnectedReason(),
			connectedProxyURL: untrailingslashit( user.getConnectedProxyURL() ),
			homeURL: untrailingslashit( site.getHomeURL() ),
			isConnected: site.isConnected(),
		};
	} );

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const canViewSharedDashboard = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability(
			'googlesitekit_view_shared_dashboard'
		)
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const goToSharedDashboard = useCallback( () => {
		dismissItem( 'shared_dashboard_splash' );

		global.location = dashboardURL;
	}, [ dashboardURL, dismissItem ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );

	const onButtonClick = useCallback(
		async ( event ) => {
			event.preventDefault();

			let moduleReauthURL;

			if ( connectAnalytics ) {
				const { error, response } = await activateModule( 'analytics' );

				if ( ! error ) {
					await trackEvent(
						VIEW_CONTEXT_DASHBOARD_SPLASH,
						'start_setup_with_analytics'
					);

					moduleReauthURL = response.moduleReauthURL;
				}
			}

			if ( proxySetupURL ) {
				await trackEvent(
					VIEW_CONTEXT_DASHBOARD_SPLASH,
					'start_user_setup',
					'proxy'
				);
			}

			if ( proxySetupURL && ! isConnected ) {
				await trackEvent(
					VIEW_CONTEXT_DASHBOARD_SPLASH,
					'start_site_setup',
					'proxy'
				);
			}

			if ( moduleReauthURL && proxySetupURL ) {
				navigateTo(
					addQueryArgs( proxySetupURL, { redirect: moduleReauthURL } )
				);
			} else {
				navigateTo( proxySetupURL );
			}
		},
		[
			proxySetupURL,
			navigateTo,
			isConnected,
			activateModule,
			connectAnalytics,
		]
	);

	// @TODO: this needs to be migrated to the core/site datastore in the future
	const { errorMessage } = global._googlesitekitLegacyData.setup;

	let title;
	let description;
	let cellDetailsProp = {
		smSize: 4,
		mdSize: 8,
		lgSize: 6,
	};

	if ( ! analyticsModuleActive ) {
		cellDetailsProp = {
			smSize: 4,
			mdSize: 8,
			lgSize: 8,
		};
	}

	if ( 'revoked' === getQueryArg( location.href, 'googlesitekit_context' ) ) {
		title = sprintf(
			/* translators: %s is the site's hostname. (e.g. example.com) */
			__( 'You revoked access to Site Kit for %s', 'google-site-kit' ),
			punycode.toUnicode( new URL( siteURL ).hostname )
		);
		description = __(
			'Site Kit will no longer have access to your account. If you’d like to reconnect Site Kit, click "Sign in with Google" below to generate new credentials.',
			'google-site-kit'
		);
	} else if (
		DISCONNECTED_REASON_CONNECTED_URL_MISMATCH === disconnectedReason
	) {
		title = __( 'Reconnect Site Kit', 'google-site-kit' );
		description = __(
			'Looks like the URL of your site has changed. In order to continue using Site Kit, you’ll need to reconnect, so that your plugin settings are updated with the new URL.',
			'google-site-kit'
		);
	} else if ( isSecondAdmin ) {
		title = __(
			'Connect your Google account to Site Kit',
			'google-site-kit'
		);
		description = __(
			'Site Kit has already been configured by another admin of this site. To use Site Kit as well, sign in with your Google account which has access to Google services for this site (e.g. Google Analytics). Once you complete the 3 setup steps, you’ll see stats from all activated Google products.',
			'google-site-kit'
		);
	} else {
		title = __( 'Set up Site Kit', 'google-site-kit' );
		description = __(
			'Get insights on how people find your site, as well as how to improve and monetize your site’s content, directly in your WordPress dashboard.',
			'google-site-kit'
		);
	}

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			{ errorMessage && (
				<BannerNotification
					id="setup_error"
					type="win-error"
					title={ __(
						'Oops! There was a problem during set up. Please try again.',
						'google-site-kit'
					) }
					description={ errorMessage }
					isDismissible={ false }
				/>
			) }
			{ getQueryArg( location.href, 'notification' ) ===
				'reset_success' && (
				<BannerNotification
					id="reset_success"
					title={ __(
						'Site Kit by Google was successfully reset.',
						'google-site-kit'
					) }
					isDismissible={ false }
				/>
			) }
			<div className="googlesitekit-setup">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout>
								<section className="googlesitekit-setup__splash">
									<Grid>
										<Row className="googlesitekit-setup__content">
											<Cell
												smSize={ 4 }
												mdSize={ 8 }
												lgSize={
													! analyticsModuleActive
														? 4
														: 6
												}
												className="googlesitekit-setup__icon"
											>
												{ analyticsModuleActive && (
													<WelcomeSVG
														width="570"
														height="336"
													/>
												) }

												{ ! analyticsModuleActive && (
													<WelcomeAnalyticsSVG
														height="167"
														width="175"
													/>
												) }
											</Cell>

											<Cell { ...cellDetailsProp }>
												<h1 className="googlesitekit-setup__title">
													{ title }
												</h1>

												<p className="googlesitekit-setup__description">
													{ description }
												</p>
												{ DISCONNECTED_REASON_CONNECTED_URL_MISMATCH ===
													disconnectedReason &&
													connectedProxyURL !==
														homeURL && (
														<p>
															{ sprintf(
																/* translators: %s: Previous Connected Proxy URL */
																__(
																	'— Old URL: %s',
																	'google-site-kit'
																),
																connectedProxyURL
															) }
															<br />
															{ sprintf(
																/* translators: %s: Connected Proxy URL */
																__(
																	'— New URL: %s',
																	'google-site-kit'
																),
																homeURL
															) }
														</p>
													) }

												{ ! analyticsModuleActive && (
													<ActivateAnalyticsNotice />
												) }

												<CompatibilityChecks>
													{ ( {
														complete,
														inProgressFeedback,
														ctaFeedback,
													} ) => (
														<Fragment>
															{ ctaFeedback }

															<OptIn />

															<div className="googlesitekit-start-setup-wrap">
																<Button
																	className="googlesitekit-start-setup"
																	href={
																		proxySetupURL
																	}
																	onClick={
																		onButtonClick
																	}
																	disabled={
																		! complete
																	}
																>
																	{ __(
																		'Sign in with Google',
																		'google-site-kit'
																	) }
																</Button>
																{
																	inProgressFeedback
																}
																{ dashboardSharingEnabled &&
																	canViewSharedDashboard && (
																		<Link
																			onClick={
																				goToSharedDashboard
																			}
																		>
																			{ __(
																				'Go to dashboard',
																				'google-site-kit'
																			) }
																		</Link>
																	) }
																{ ! isSecondAdmin &&
																	isResettable &&
																	complete && (
																		<ResetButton />
																	) }
															</div>
														</Fragment>
													) }
												</CompatibilityChecks>
											</Cell>
										</Row>
									</Grid>
								</section>
							</Layout>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
