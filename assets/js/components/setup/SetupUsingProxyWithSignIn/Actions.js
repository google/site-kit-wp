/**
 * Actions component for SetupUsingProxyWithSignIn.
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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import OptIn from '../../OptIn';
import ResetButton from '../../ResetButton';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from '../constants';
import useViewContext from '../../../hooks/useViewContext';
import { trackEvent } from '../../../util';

export default function Actions( {
	proxySetupURL,
	onButtonClick,
	complete,
	inProgressFeedback,
} ) {
	const viewContext = useViewContext();
	const { dismissItem } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const isSecondAdmin = useSelect( ( select ) =>
		select( CORE_SITE ).hasConnectedAdmins()
	);
	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);
	const hasViewableModules = useSelect(
		( select ) => !! select( CORE_USER ).getViewableModules()?.length
	);
	const isResettable = useSelect( ( select ) =>
		select( CORE_SITE ).isResettable()
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const goToSharedDashboard = useCallback( () => {
		Promise.all( [
			dismissItem( SHARED_DASHBOARD_SPLASH_ITEM_KEY ),
			trackEvent( viewContext, 'skip_setup_to_viewonly' ),
		] ).finally( () => {
			navigateTo( dashboardURL );
		} );
	}, [ dashboardURL, dismissItem, navigateTo, viewContext ] );

	return (
		<Fragment>
			<OptIn />

			<div className="googlesitekit-start-setup-wrap">
				<Button
					className="googlesitekit-start-setup"
					// Doesn't look like the `href` is actually used for the navigation, but it's still included here.
					href={ proxySetupURL }
					// HERE, `onButtonClick` is the function that will be called when the button is clicked.
					// It will navigate to the proxy, optionally adding the `redirect` query arg to the URL.
					// See `SetupUsingProxyWithSignIn` component for more details.
					onClick={ onButtonClick }
					disabled={ ! complete }
				>
					{ _x(
						'Sign in with Google',
						'Prompt to authenticate Site Kit with Google Account',
						'google-site-kit'
					) }
				</Button>
				{ inProgressFeedback }
				{ hasMultipleAdmins &&
					isSecondAdmin &&
					hasViewableModules &&
					complete && (
						<Button onClick={ goToSharedDashboard } tertiary>
							{ __(
								'Skip sign-in and view limited dashboard',
								'google-site-kit'
							) }
						</Button>
					) }
				{ ! isSecondAdmin && isResettable && complete && (
					<ResetButton />
				) }
			</div>
		</Fragment>
	);
}
