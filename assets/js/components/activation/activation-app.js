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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { trackEvent } from '../../util';
import { ActivationMain } from './activation-main';
import NotificationCounter from '../legacy-notifications/notification-counter';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER, PERMISSION_VIEW_DASHBOARD } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

export function ActivationApp() {
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const proxySetupURL = useSelect( ( select ) => select( CORE_SITE ).getProxySetupURL() );
	const dashboardURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ) );
	const splashURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-splash' ) );
	const canViewDashboard = useSelect( ( select ) => select( CORE_USER ).hasCapability( PERMISSION_VIEW_DASHBOARD ) );

	let buttonURL = proxySetupURL || splashURL;
	let buttonLabel = __( 'Start setup', 'google-site-kit' );

	if ( canViewDashboard ) {
		buttonURL = dashboardURL;
		buttonLabel = __( 'Go to Dashboard', 'google-site-kit' );
	}

	const onButtonClick = useCallback( async ( event ) => {
		event.preventDefault();
		await trackEvent( 'plugin_setup', proxySetupURL ? 'proxy_start_setup_banner' : 'goto_sitekit' );
		navigateTo( buttonURL );
	}, [ proxySetupURL, buttonURL, navigateTo ] );

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
