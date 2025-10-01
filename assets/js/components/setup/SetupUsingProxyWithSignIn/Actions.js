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
import {
	createInterpolateElement,
	Fragment,
	useCallback,
} from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import Link from '@/js/components/Link';
import OptIn from '@/js/components/OptIn';
import ResetButton from '@/js/components/ResetButton';
import StepHint from '@/js/components/setup/SetupUsingProxyWithSignIn/StepHint';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from '@/js/components/setup/constants';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';

export default function Actions( {
	proxySetupURL,
	onButtonClick,
	complete,
	inProgressFeedback,
} ) {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

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
					href={ proxySetupURL }
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
			{ setupFlowRefreshEnabled && (
				<StepHint
					leadingText={ __(
						'Why is this required?',
						'google-site-kit'
					) }
					tooltipText={ createInterpolateElement(
						__(
							'Site Kit needs to connect to your Google account to access data from Google products like Search Console or Analytics and display it on your dashboard. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: <Link external hideExternalIndicator />,
						}
					) }
				/>
			) }
		</Fragment>
	);
}
