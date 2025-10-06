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
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

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
import {
	ANALYTICS_NOTICE_FORM_NAME,
	ANALYTICS_NOTICE_CHECKBOX,
} from '@/js/components/setup/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { setItem } from '@/js/googlesitekit/api/cache';
import useViewContext from '@/js/hooks/useViewContext';
import Header from './Header';
import Splash from './Splash';
import Actions from './Actions';
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';
import useFormValue from '@/js/hooks/useFormValue';
import { useFeature } from '@/js/hooks/useFeature';

export default function SetupUsingProxyWithSignIn() {
	const viewContext = useViewContext();
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );

	const proxySetupURL = useSelect( ( select ) =>
		select( CORE_SITE ).getProxySetupURL()
	);
	const isConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isConnected()
	);
	const connectAnalytics = useFormValue(
		ANALYTICS_NOTICE_FORM_NAME,
		ANALYTICS_NOTICE_CHECKBOX
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

	return (
		<Fragment>
			<Header />
			<div
				className={ classNames( 'googlesitekit-setup', {
					'googlesitekit-setup--enhanced': setupFlowRefreshEnabled,
				} ) }
			>
				<Grid collapsed={ setupFlowRefreshEnabled }>
					<Row>
						<Cell size={ 12 }>
							{ getQueryArg( location.href, 'notification' ) ===
								'reset_success' && (
								<Fragment>
									<Notice
										id="reset_success"
										title={ __(
											'Site Kit by Google was successfully reset.',
											'google-site-kit'
										) }
										type={ TYPES.SUCCESS }
									/>
									<br />
								</Fragment>
							) }
							<Layout rounded>
								<Splash>
									{ ( {
										complete,
										inProgressFeedback,
										ctaFeedback,
									} ) => (
										<Actions
											proxySetupURL={ proxySetupURL }
											onButtonClick={ onButtonClick }
											complete={ complete }
											inProgressFeedback={
												inProgressFeedback
											}
											ctaFeedback={ ctaFeedback }
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
