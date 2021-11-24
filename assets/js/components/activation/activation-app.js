/**
 * Activation App component.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { VIEW_CONTEXT_ACTIVATION } from '../../googlesitekit/constants';
import { trackEvent } from '../../util';
import { ActivationMain } from './activation-main';
import NotificationCounter from '../legacy-notifications/notification-counter';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_VIEW_DASHBOARD,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	ANALYTICS_NOTICE_FORM_NAME,
	ANALYTICS_NOTICE_CHECKBOX,
} from '../setup/constants';
const { useSelect, useDispatch } = Data;

export function ActivationApp() {
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );

	const proxySetupURL = useSelect( ( select ) =>
		select( CORE_SITE ).getProxySetupURL()
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);
	const splashURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-splash' )
	);
	const canViewDashboard = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_VIEW_DASHBOARD )
	);
	const isConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isConnected()
	);
	const isUsingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);
	const connectAnalytics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			ANALYTICS_NOTICE_FORM_NAME,
			ANALYTICS_NOTICE_CHECKBOX
		)
	);

	useMount( () => {
		trackEvent( VIEW_CONTEXT_ACTIVATION, 'view_notification' );
	} );

	let buttonURL = proxySetupURL || splashURL;
	let buttonLabel = __( 'Start setup', 'google-site-kit' );

	if ( canViewDashboard ) {
		buttonURL = dashboardURL;
		buttonLabel = __( 'Go to Dashboard', 'google-site-kit' );
	}

	const onButtonClick = useCallback(
		async ( event ) => {
			event.preventDefault();

			let moduleReauthURL;

			if ( connectAnalytics ) {
				const { error, response } = await activateModule( 'analytics' );

				if ( ! error ) {
					await trackEvent(
						VIEW_CONTEXT_ACTIVATION,
						'start_setup_with_analytics'
					);

					moduleReauthURL = response.moduleReauthURL;
				}
			}

			await trackEvent( VIEW_CONTEXT_ACTIVATION, 'confirm_notification' );

			if ( ! canViewDashboard && proxySetupURL && ! isConnected ) {
				await trackEvent(
					VIEW_CONTEXT_ACTIVATION,
					'start_site_setup',
					isUsingProxy ? 'proxy' : 'custom-oauth'
				);
			}

			if ( ! canViewDashboard && proxySetupURL ) {
				await trackEvent(
					VIEW_CONTEXT_ACTIVATION,
					'start_user_setup',
					isUsingProxy ? 'proxy' : 'custom-oauth'
				);
			}

			if ( moduleReauthURL && proxySetupURL ) {
				navigateTo(
					addQueryArgs( proxySetupURL, { redirect: moduleReauthURL } )
				);
			} else {
				navigateTo( buttonURL );
			}
		},
		[
			canViewDashboard,
			proxySetupURL,
			isConnected,
			navigateTo,
			buttonURL,
			isUsingProxy,
			activateModule,
			connectAnalytics,
		]
	);

	if ( ! buttonURL ) {
		return null;
	}

	return (
		<Fragment>
			<NotificationCounter />
			<ActivationMain
				buttonURL={ buttonURL }
				buttonLabel={ buttonLabel }
				onButtonClick={ onButtonClick }
			/>
		</Fragment>
	);
}
