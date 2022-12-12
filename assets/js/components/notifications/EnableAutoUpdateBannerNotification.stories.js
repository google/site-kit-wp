/* eslint-disable no-unused-vars */
/**
 * CoreSiteBannerNotifications Component Stories.
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
 * Internal dependencies
 */
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import EnableAutoUpdateBannerNotification from './EnableAutoUpdateBannerNotification';

const Template = ( { setupRegistry } ) => (
	<EnableAutoUpdateBannerNotification />
);

export const Notification = Template.bind( {} );

export const Error = Template.bind( {} );
Error.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveError(
				'Invalid data. The item does not exist.',
				'enableAutoUpdate',
				[]
			);
	},
};

export default {
	title: 'Components/EnableAutoUpdateBannerNotification',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					updatePluginCapacity: true,
					autoUpdatesEnabled: true,
					updatePluginNonce: '751b9198d2',
					siteKitAutoUpdatesEnabled: false,
				} );
				registry.dispatch( CORE_USER ).receiveCapabilities( {
					googlesitekit_update_plugins: true,
				} );

				if ( args.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
