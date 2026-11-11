/**
 * IncompleteSetupReminderNotification stories.
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
 * External dependencies
 */
import { ElementType } from 'react';

/**
 * Internal dependencies
 */
import { Registry } from 'googlesitekit-data';
import { getFeatureIncompleteSetupReminderKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { registerFeatures } from '@/js/modules/reader-revenue-manager/feature-discovery';
import {
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import IncompleteSetupReminderNotification from './IncompleteSetupReminderNotification';

const NotificationWithComponentProps = withNotificationComponentProps(
	getFeatureIncompleteSetupReminderKey( 'newsletter-signup' )
)( IncompleteSetupReminderNotification );

export function NewsletterSignup() {
	return <NotificationWithComponentProps />;
}
NewsletterSignup.storyName = 'Newsletter sign-up';

export default {
	title: 'Components/FeatureDiscovery/IncompleteSetupReminderNotification',
	component: IncompleteSetupReminderNotification,
	parameters: { features: [ 'featureDiscoveryHub', 'rrmExpressSetup' ] },
	decorators: [
		( Story: ElementType ) => {
			function setupRegistry( registry: Registry ) {
				provideSiteInfo( registry );

				provideModules( registry, [
					{
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: true,
						connected: false,
					},
				] );

				provideUserAuthentication( registry, {
					grantedScopes: EXPRESS_SETUP_SCOPES,
				} );

				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( 'https://example.com/connect' );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
				registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( { configuredCTAs: {} } );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetUserSettings( {
						lastActionedExpressSetups: {
							'newsletter-signup:new': 1781524800,
						},
					} );

				registerFeatures( createFeatureDiscovery( registry ) );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
