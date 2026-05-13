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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { trackEvent } from '@/js/util';
import Layout from '@/js/components/layout/Layout';
import { Grid, Row, Cell } from '@/js/material-components';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	ANALYTICS_NOTICE_FORM_NAME,
	ANALYTICS_NOTICE_CHECKBOX,
} from '@/js/components/setup/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { setItem } from '@/js/googlesitekit/api/cache';
import useViewContext from '@/js/hooks/useViewContext';
import Header from './Header';
import ProgressIndicator from '@/js/components/ProgressIndicator';
import Splash from './Splash';
import Actions from './Actions';
import ResetNotice from './ResetNotice';
import { useFeature } from '@/js/hooks/useFeature';
import useForwardableParams from '@/js/hooks/useForwardableParams';
import useFormValue from '@/js/hooks/useFormValue';

export default function SetupUsingProxyWithSignIn() {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const forwardableParams = useForwardableParams();

	const viewContext = useViewContext();
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );
	const { saveInitialSetupSettings } = useDispatch( CORE_USER );

	const proxySetupURL = useSelect( ( select ) =>
		select( CORE_SITE ).getProxySetupURL()
	);
	const isConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isConnected()
	);
	const [ connectAnalytics ] = useFormValue(
		ANALYTICS_NOTICE_FORM_NAME,
		ANALYTICS_NOTICE_CHECKBOX
	);
	const postAuthDashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL(
			'googlesitekit-dashboard',
			forwardableParams
		)
	);

	const onButtonClick = useCallback(
		async ( event ) => {
			event.preventDefault();

			let moduleReauthURL;

			if ( connectAnalytics ) {
				const { error, response } = await activateModule(
					MODULE_SLUG_ANALYTICS_4
				);

				if ( ! error ) {
					await trackEvent(
						`${ viewContext }_setup`,
						setupFlowRefreshEnabled
							? 'setup_flow_v3_start_with_analytics'
							: 'start_setup_with_analytics'
					);

					moduleReauthURL = response.moduleReauthURL;

					if ( setupFlowRefreshEnabled ) {
						moduleReauthURL = addQueryArgs( moduleReauthURL, {
							showProgress: true,
						} );

						await saveInitialSetupSettings( {
							isAnalyticsSetupComplete: false,
						} );
					}
				}
			}

			if ( proxySetupURL ) {
				await Promise.all( [
					setItem( 'start_user_setup', true ),
					trackEvent(
						`${ viewContext }_setup`,
						setupFlowRefreshEnabled
							? 'setup_flow_v3_start_user_setup'
							: 'start_user_setup',
						'proxy'
					),
				] );
			}

			if ( proxySetupURL && ! isConnected ) {
				await Promise.all( [
					setItem( 'start_site_setup', true ),
					trackEvent(
						`${ viewContext }_setup`,
						setupFlowRefreshEnabled
							? 'setup_flow_v3_start_site_setup'
							: 'start_site_setup',
						'proxy'
					),
				] );
			}

			if ( moduleReauthURL && proxySetupURL ) {
				const moduleReauthURLWithParams = addQueryArgs(
					moduleReauthURL,
					forwardableParams
				);

				navigateTo(
					addQueryArgs( proxySetupURL, {
						redirect: moduleReauthURLWithParams,
					} )
				);
			} else if (
				proxySetupURL &&
				Object.keys( forwardableParams ).length &&
				postAuthDashboardURL
			) {
				navigateTo(
					addQueryArgs( proxySetupURL, {
						redirect: postAuthDashboardURL,
					} )
				);
			} else {
				navigateTo( proxySetupURL );
			}
		},
		[
			connectAnalytics,
			proxySetupURL,
			postAuthDashboardURL,
			isConnected,
			activateModule,
			forwardableParams,
			viewContext,
			setupFlowRefreshEnabled,
			saveInitialSetupSettings,
			navigateTo,
		]
	);

	const splashSetupContent = (
		<Layout rounded={ ! setupFlowRefreshEnabled }>
			<Splash>
				{ ( { complete, inProgressFeedback, ctaFeedback } ) => (
					<Actions
						proxySetupURL={ proxySetupURL }
						onButtonClick={ onButtonClick }
						forwardableParams={ forwardableParams }
						complete={ complete }
						inProgressFeedback={ inProgressFeedback }
						ctaFeedback={ ctaFeedback }
					/>
				) }
			</Splash>
		</Layout>
	);

	return (
		<Fragment>
			<Header />
			<div
				className={ classnames( 'googlesitekit-setup', {
					'googlesitekit-initial-setup': setupFlowRefreshEnabled,
				} ) }
			>
				{ setupFlowRefreshEnabled ? (
					<Fragment>
						<ProgressIndicator />
						{ splashSetupContent }
					</Fragment>
				) : (
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<ResetNotice />
								{ splashSetupContent }
							</Cell>
						</Row>
					</Grid>
				) }
			</div>
		</Fragment>
	);
}
