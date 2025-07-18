/**
 * GoogleTagGatewaySetupBanner Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { provideModules } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { WEEK_IN_SECONDS } from '../../util';
import GoogleTagGatewaySetupBanner from './GoogleTagGatewaySetupBanner';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import {
	GTG_SETUP_CTA_BANNER_NOTIFICATION,
	NOTIFICATION_AREAS,
} from '../../googlesitekit/notifications/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';

const NotificationWithComponentProps = withNotificationComponentProps(
	GTG_SETUP_CTA_BANNER_NOTIFICATION
)( GoogleTagGatewaySetupBanner );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind();
Default.storyName = 'GoogleTagGatewaySetupBanner';
Default.scenario = {};

export const ErrorOnCTAClick = Template.bind();
ErrorOnCTAClick.storyName = 'ErrorOnCTAClick';
ErrorOnCTAClick.scenario = {};
ErrorOnCTAClick.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveError(
			{
				code: 'test_error',
				message: 'Test Error',
				data: {},
			},
			'saveGoogleTagGatewaySettings',
			[ {} ]
		);
	},
};

export default {
	title: 'Modules/GoogleTagGateway/Dashboard/GoogleTagGatewaySetupBanner',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: GTG_SETUP_CTA_BANNER_NOTIFICATION,
						active: false,
					},
				] );

				// Register the notification to avoid errors in console.
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( GTG_SETUP_CTA_BANNER_NOTIFICATION, {
						Component: GoogleTagGatewaySetupBanner,
						areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						isDismissible: true,
					} );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/dismiss-prompt'
					),
					{
						body: {
							[ GTG_SETUP_CTA_BANNER_NOTIFICATION ]: {
								expires: Date.now() / 1000 + WEEK_IN_SECONDS,
								count: 1,
							},
						},
						status: 200,
					}
				);

				args.setupRegistry?.( registry );
			};

			return (
				<div
					style={ {
						minHeight: '200px',
						display: 'flex',
						alignItems: 'center',
					} }
				>
					<div id="adminmenu">
						{ /* eslint-disable-next-line jsx-a11y/anchor-has-content */ }
						<a href="http://test.test/?page=googlesitekit-settings" />
					</div>
					<div style={ { flex: 1 } }>
						<WithRegistrySetup func={ setupRegistry }>
							<Story />
						</WithRegistrySetup>
					</div>
				</div>
			);
		},
	],
};
