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
import {
	provideModules,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import UnsatisfiedScopesAlertGTE from './UnsatisfiedScopesAlertGTE';

const NotificationWithComponentProps = withNotificationComponentProps(
	'gathering-data-notification'
)( UnsatisfiedScopesAlertGTE );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'UnsatisfiedScopesAlertGTE';

export default {
	title: 'Components/Notifications/Errors/UnsatisfiedScopesAlertGTE',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );
				provideUserAuthentication( registry, {
					unsatisfiedScopes: [
						'https://www.googleapis.com/auth/tagmanager.readonly',
					],
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
