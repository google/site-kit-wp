/**
 * AccountLinkedViaGoogleForWooCommerceSubtleNotification Component Stories.
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
 * Internal dependencies
 */
import { MODULES_ADS, PLUGINS } from '../../datastore/constants';
import AccountLinkedViaGoogleForWooCommerceSubtleNotification from './AccountLinkedViaGoogleForWooCommerceSubtleNotification';
import { provideSiteInfo } from '../../../../../../tests/js/utils';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

const NotificationWithComponentProps = withNotificationComponentProps(
	'account-linked-via-google-for-woocommerce'
)( AccountLinkedViaGoogleForWooCommerceSubtleNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Ads = Template.bind( {} );
Ads.storyName = 'AccountLinkedViaGoogleForWooCommerceSubtleNotification';
Ads.scenario = {};

export default {
	title: 'Modules/Ads/Notifications/AccountLinkedViaGoogleForWooCommerceSubtleNotification',
	component: AccountLinkedViaGoogleForWooCommerceSubtleNotification,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				registry.dispatch( MODULES_ADS ).receiveModuleData( {
					plugins: {
						[ PLUGINS.WOOCOMMERCE ]: {
							active: true,
						},
						[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
							active: true,
							adsConnected: true,
						},
					},
				} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
