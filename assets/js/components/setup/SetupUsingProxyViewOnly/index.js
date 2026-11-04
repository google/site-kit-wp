/**
 * SetupUsingProxyViewOnly component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import Layout from '@/js/components/layout/Layout';
import ProgressIndicator from '@/js/components/ProgressIndicator';
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from '@/js/components/setup/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useForwardableParams from '@/js/hooks/useForwardableParams';
import useViewContext from '@/js/hooks/useViewContext';
import { Grid } from '@/js/material-components';
import { trackEvent } from '@/js/util';
import Header from './Header';
import IntentSetupAdminRequiredNotice from './IntentSetupAdminRequiredNotice';
import SplashViewOnlyContent from './SplashViewOnlyContent';

export default function SetupUsingProxyViewOnly() {
	const viewContext = useViewContext();

	const { dismissItem } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const forwardableParams = useForwardableParams();

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL(
			'googlesitekit-dashboard',
			forwardableParams
		)
	);

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'dashboard-sharing' )
	);

	const onButtonClick = useCallback( () => {
		Promise.all( [
			dismissItem( SHARED_DASHBOARD_SPLASH_ITEM_KEY ),
			trackEvent( viewContext, 'confirm_viewonly' ),
		] ).finally( () => {
			const redirectURL = addQueryArgs( dashboardURL, {
				notification:
					forwardableParams.notification || 'initial_setup_success',
			} );

			navigateTo( redirectURL );
		} );
	}, [
		forwardableParams.notification,
		dashboardURL,
		dismissItem,
		navigateTo,
		viewContext,
	] );

	if ( ! dashboardURL ) {
		return null;
	}

	return (
		<Fragment>
			<Header />
			<div className="googlesitekit-setup googlesitekit-view-only-splash googlesitekit-initial-setup">
				<ProgressIndicator />
				<Layout>
					<section className="googlesitekit-splash">
						<Grid>
							<IntentSetupAdminRequiredNotice />
							<SplashViewOnlyContent
								documentationURL={ documentationURL }
								onButtonClick={ onButtonClick }
							/>
						</Grid>
					</section>
				</Layout>
			</div>
		</Fragment>
	);
}
