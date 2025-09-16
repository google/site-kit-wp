/**
 * Splash component for SetupUsingProxyWithSignIn.
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
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { useFeature } from '@/js/hooks/useFeature';
import LegacySplash from '@/js/components/setup/SetupUsingProxyWithSignIn/LegacySplash';
import RefreshedSplash from '@/js/components/setup/SetupUsingProxyWithSignIn/RefreshedSplash';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
} from '@/js/googlesitekit/datastore/user/constants';
import { Grid } from '@/js/material-components';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

export default function Splash( { children } ) {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( MODULE_SLUG_ANALYTICS_4 )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( MODULE_SLUG_ANALYTICS_4 )
	);
	const connectedProxyURL = useSelect( ( select ) =>
		select( CORE_USER ).getConnectedProxyURL()
	);
	const isSecondAdmin = useSelect( ( select ) =>
		select( CORE_SITE ).hasConnectedAdmins()
	);
	const siteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);
	const homeURL = useSelect( ( select ) => select( CORE_SITE ).getHomeURL() );
	const secondAdminLearnMoreLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'already-configured' )
	);
	const disconnectedReason = useSelect( ( select ) =>
		select( CORE_USER ).getDisconnectedReason()
	);

	let title;
	let description;

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
	} else if ( isSecondAdmin ) {
		title = __(
			'Connect your Google account to Site Kit',
			'google-site-kit'
		);
		description = __(
			'Site Kit has already been configured by another admin of this site. To use Site Kit as well, sign in with your Google account which has access to Google services for this site (e.g. Google Analytics). Once you complete the 3 setup steps, you’ll see stats from all activated Google services.',
			'google-site-kit'
		);
	} else {
		title = setupFlowRefreshEnabled
			? __( "Let's get started!", 'google-site-kit' )
			: __( 'Set up Site Kit', 'google-site-kit' );
		description = ! setupFlowRefreshEnabled
			? __(
					'Get insights on how people find your site, as well as how to improve and monetize your site’s content, directly in your WordPress dashboard',
					'google-site-kit'
			  )
			: null;
	}

	const classname = setupFlowRefreshEnabled
		? 'googlesitekit-splash'
		: 'googlesitekit-setup__splash';

	const SplashComponent = setupFlowRefreshEnabled
		? RefreshedSplash
		: LegacySplash;

	const splashProps = {
		analyticsModuleActive,
		secondAdminLearnMoreLink,
		homeURL,
		analyticsModuleAvailable,
		disconnectedReason,
		title,
		description,
		connectedProxyURL,
	};

	return (
		<section className={ classname }>
			<Grid>
				<SplashComponent { ...splashProps }>
					{ children }
				</SplashComponent>
			</Grid>
		</section>
	);
}
