/**
 * SetupUsingProxyWithSignIn component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useSelect, useDispatch } from 'googlesitekit-data';
import { trackEvent, untrailingslashit } from '../../../util';
import Layout from '../../layout/Layout';
import { Grid, Row, Cell } from '../../../material-components';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
} from '../../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	ANALYTICS_NOTICE_FORM_NAME,
	ANALYTICS_NOTICE_CHECKBOX,
	SHARED_DASHBOARD_SPLASH_ITEM_KEY,
} from '../constants';
import useViewContext from '../../../hooks/useViewContext';
import { setItem } from '../../../googlesitekit/api/cache';
import SetupHeader from './SetupHeader';
import Splash from './Splash';
import SetupActions from './Actions';

export default function SetupUsingProxyWithSignIn() {
	const viewContext = useViewContext();

	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics-4' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
	);
	const connectAnalytics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			ANALYTICS_NOTICE_FORM_NAME,
			ANALYTICS_NOTICE_CHECKBOX
		)
	);

	const isSecondAdmin = useSelect( ( select ) =>
		select( CORE_SITE ).hasConnectedAdmins()
	);
	const isResettable = useSelect( ( select ) =>
		select( CORE_SITE ).isResettable()
	);
	const siteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);
	const proxySetupURL = useSelect( ( select ) =>
		select( CORE_SITE ).getProxySetupURL()
	);
	const homeURL = useSelect( ( select ) =>
		untrailingslashit( select( CORE_SITE ).getHomeURL() )
	);
	const isConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isConnected()
	);
	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);
	const secondAdminLearnMoreLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'already-configured' )
	);
	const disconnectedReason = useSelect( ( select ) =>
		select( CORE_USER ).getDisconnectedReason()
	);
	const connectedProxyURL = useSelect( ( select ) =>
		untrailingslashit( select( CORE_USER ).getConnectedProxyURL() )
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);
	const changedURLHelpLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'url-has-changed' )
	);
	const hasViewableModules = useSelect(
		( select ) => !! select( CORE_USER ).getViewableModules()?.length
	);

	const { dismissItem } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );

	const goToSharedDashboard = useCallback( () => {
		Promise.all( [
			dismissItem( SHARED_DASHBOARD_SPLASH_ITEM_KEY ),
			trackEvent( viewContext, 'skip_setup_to_viewonly' ),
		] ).finally( () => {
			navigateTo( dashboardURL );
		} );
	}, [ dashboardURL, dismissItem, navigateTo, viewContext ] );

	const onButtonClick = useCallback(
		async ( event ) => {
			event.preventDefault();

			let moduleReauthURL;

			if ( connectAnalytics ) {
				const { error, response } = await activateModule(
					'analytics-4'
				);

				if ( ! error ) {
					await trackEvent(
						`${ viewContext }_setup`,
						'start_setup_with_analytics'
					);

					moduleReauthURL = response.moduleReauthURL;
				}
			}

			if ( proxySetupURL ) {
				await Promise.all( [
					setItem( 'start_user_setup', true ),
					trackEvent(
						`${ viewContext }_setup`,
						'start_user_setup',
						'proxy'
					),
				] );
			}

			if ( proxySetupURL && ! isConnected ) {
				await Promise.all( [
					setItem( 'start_site_setup', true ),
					trackEvent(
						`${ viewContext }_setup`,
						'start_site_setup',
						'proxy'
					),
				] );
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
			viewContext,
		]
	);

	let title;
	let description;
	let showLearnMoreLink = false;
	let getHelpURL = null;

	if ( 'revoked' === getQueryArg( location.href, 'googlesitekit_context' ) ) {
		title = sprintf(
			/* translators: %s: is the site's hostname. (e.g. example.com) */
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

		getHelpURL = changedURLHelpLink;
	} else if ( isSecondAdmin ) {
		title = __(
			'Connect your Google account to Site Kit',
			'google-site-kit'
		);
		description = __(
			'Site Kit has already been configured by another admin of this site. To use Site Kit as well, sign in with your Google account which has access to Google services for this site (e.g. Google Analytics). Once you complete the 3 setup steps, you’ll see stats from all activated Google services.',
			'google-site-kit'
		);
		showLearnMoreLink = true;
	} else {
		title = __( 'Set up Site Kit', 'google-site-kit' );
		description = __(
			'Get insights on how people find your site, as well as how to improve and monetize your site’s content, directly in your WordPress dashboard',
			'google-site-kit'
		);
	}

	return (
		<Fragment>
			<SetupHeader />
			<div className="googlesitekit-setup">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout rounded>
								<Splash
									title={ title }
									description={ description }
									showLearnMoreLink={ showLearnMoreLink }
									secondAdminLearnMoreLink={
										secondAdminLearnMoreLink
									}
									getHelpURL={ getHelpURL }
									disconnectedReason={ disconnectedReason }
									connectedProxyURL={ connectedProxyURL }
									homeURL={ homeURL }
									analyticsModuleActive={
										analyticsModuleActive
									}
									analyticsModuleAvailable={
										analyticsModuleAvailable
									}
								>
									{ ( { complete, inProgressFeedback } ) => (
										<SetupActions
											proxySetupURL={ proxySetupURL }
											onButtonClick={ onButtonClick }
											goToSharedDashboard={
												goToSharedDashboard
											}
											isSecondAdmin={ isSecondAdmin }
											hasMultipleAdmins={
												hasMultipleAdmins
											}
											hasViewableModules={
												hasViewableModules
											}
											isResettable={ isResettable }
											complete={ complete }
											inProgressFeedback={
												inProgressFeedback
											}
										/>
									) }
								</Splash>
							</Layout>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
