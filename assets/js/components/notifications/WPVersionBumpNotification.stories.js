/**
 * WordPress Version Upgrade Notification Component Stories.
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
 * Internal dependencies
 */
import WPVersionBumpNotification from './WPVersionBumpNotification';
import { provideSiteInfo } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WPVersionBumpNotification { ...args } />
	</WithRegistrySetup>
);

export const AdminWithUpdateCorePermissions = Template.bind( {} );
AdminWithUpdateCorePermissions.storyName = 'Admin With Update Core Permissions';
AdminWithUpdateCorePermissions.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, {
			wpVersion: {
				major: 5,
				minor: 0,
				version: '5.0.0',
			},
			updateCoreURL: 'https://example.com/wp-admin/update-core.php',
		} );
	},
};

export const AdminWithoutUpdateCorePermissions = Template.bind( {} );
AdminWithoutUpdateCorePermissions.storyName =
	'Admin Without Update Core Permissions';
AdminWithoutUpdateCorePermissions.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, {
			wpVersion: {
				major: 5,
				minor: 0,
				version: '5.0.0',
			},
		} );
	},
};

export default {
	title: 'Components/WPVersionBumpNotification',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
