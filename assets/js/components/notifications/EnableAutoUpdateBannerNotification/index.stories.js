/**
 * EnableAutoUpdateBannerNotification Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import EnableAutoUpdateBannerNotification from '.';

function Template() {
	return <EnableAutoUpdateBannerNotification />;
}

export const Notification = Template.bind( {} );

export default {
	title: 'Components/EnableAutoUpdateBannerNotification',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-subheader">
				<Story />
			</div>
		),
		( Story, { args } ) => {
			global.ajaxurl = '/admin-ajax.php';

			const setupRegistry = ( registry ) => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					changePluginAutoUpdatesCapacity: true,
					siteKitAutoUpdatesEnabled: false,
					pluginBasename: 'google-site-kit/google-site-kit.php',
				} );
				registry.dispatch( CORE_USER ).receiveCapabilities( {
					googlesitekit_update_plugins: true,
				} );
				registry
					.dispatch( CORE_USER )
					.receiveNonces( { updates: '751b9198d2' } );

				if ( args.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			/**
			 * Mock the admin-ajax.php endpoint.
			 *
			 * Implement a 2 second delay to simulate a slow network connection and
			 * to ensure that the loading state is displayed.
			 */
			fetchMock.post(
				/^\/admin-ajax\.php/,
				new Promise( ( resolve ) => {
					setTimeout( () => {
						resolve( {
							body: { success: true },
							status: 200,
						} );
					}, 2000 );
				} )
			);

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
