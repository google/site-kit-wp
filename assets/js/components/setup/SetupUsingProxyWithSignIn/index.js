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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { trackEvent } from '../../../util';
import Layout from '../../layout/Layout';
import { Grid, Row, Cell } from '../../../material-components';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import {
	ANALYTICS_NOTICE_FORM_NAME,
	ANALYTICS_NOTICE_CHECKBOX,
} from '../constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { setItem } from '../../../googlesitekit/api/cache';
import useViewContext from '../../../hooks/useViewContext';
import Header from './Header';
import Splash from './Splash';
import Actions from './Actions';
import ProgressSegments from '../../ProgressSegments';

export default function SetupUsingProxyWithSignIn() {
	const viewContext = useViewContext();
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );

	const proxySetupURL = useSelect( ( select ) =>
		select( CORE_SITE ).getProxySetupURL()
	);
	const isConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isConnected()
	);
	const connectAnalytics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			ANALYTICS_NOTICE_FORM_NAME,
			ANALYTICS_NOTICE_CHECKBOX
		)
	);

	const onButtonClick = useCallback(
		async ( event ) => {
			event.preventDefault();

			let moduleReauthURL;

			// HERE, if Analytics is selected, we need to activate the module and get the reAuth URL.
			// This is then added to the `redirect` query arg when we navigate to the proxy.
			// We may want to change this approach in order to ensure a new screen is shown to the user
			// when returning from the proxy, because we need to continue the setup process, showing the
			// Analytics and then Key Metrics screens with the progress bar. The existing reAuth URL is used
			// both for initial setup and for a subsequent module connection.
			// Maybe we should be providing a new `page` arg in the `redirect` URL (instead of `googlesitekit-dashboard`),
			// rather than `reAuth`.
			// Bear in mind if Analytics is _not_ selected we will just want to land on the dashboard as we do now.
			// Also, think about how to indicate we'll show the Welcome modal (although this is Phase 2 so not too urgent).
			//
			// Maybe we don't have to specify whether we use a new screen or not, but mention both options and leave it to
			// the implementation to decide.
			if ( connectAnalytics ) {
				// Thinking more... Although needs proper investigation - could it be easier to add an additional
				// param to provide an extra screen to proceed to following the module setup?
				// _Probably not_, if we have to add a new screen anyway it would make sense to have it encompass both steps (leaving
				// it open for future expansion). Just need to refactor/reuse the existing module setup.
				// This is the next part of the PoC to focus on.
				const { error, response } = await activateModule(
					MODULE_SLUG_ANALYTICS_4
				);

				if ( ! error ) {
					await trackEvent(
						`${ viewContext }_setup`,
						'start_setup_with_analytics'
					);

					moduleReauthURL = addQueryArgs( response.moduleReauthURL, {
						showProgress: true,
					} );
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

	return (
		<Fragment>
			<Header />
			<ProgressSegments currentSegment={ 0 } totalSegments={ 6 } />
			<div className="googlesitekit-setup">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout rounded>
								<Splash>
									{ ( { complete, inProgressFeedback } ) => (
										<Actions
											proxySetupURL={ proxySetupURL }
											onButtonClick={ onButtonClick }
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
