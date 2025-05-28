/**
 * UnsatisfiedScopesAlert Component Stories.
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
 * Internal dependencies
 */
import { deleteItem, setItem } from '../../../googlesitekit/api/cache';
import {
	provideModules,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import { withNotificationComponentProps } from '../../../googlesitekit/notifications/util/component-props';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import UnsatisfiedScopesAlert from '.';

const NotificationWithComponentProps = withNotificationComponentProps(
	'gathering-data-notification'
)( UnsatisfiedScopesAlert );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export const ModuleSetupInProgress = Template.bind( {} );
ModuleSetupInProgress.storyName = 'Module setup in progress';
ModuleSetupInProgress.args = {
	setupRegistry: () => {
		setItem( 'module_setup', 'analytics-4' );
	},
};

export default {
	title: 'Components/Notifications/Errors/UnsatisfiedScopesAlert',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry );
				provideUserAuthentication( registry, {
					unsatisfiedScopes: [
						'https://www.googleapis.com/auth/analytics.readonly',
					],
				} );

				// Ensure the storage item is unavailable by default.
				deleteItem( 'module_setup' );

				// Call story-specific setup.
				args.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
