/**
 * SetupErrorNotification Component Stories.
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
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import SetupErrorNotification from './SetupErrorNotification';

const NOTIFICATION_ID = 'setup_plugin_error';

const NotificationWithComponentProps = withNotificationComponentProps(
	NOTIFICATION_ID
)( SetupErrorNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'SetupErrorNotification';

export default {
	title: 'Components/Notifications/Errors/SetupErrorNotification',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry, {
					authenticated: false,
				} );

				provideSiteInfo( registry, {
					setupErrorRedoURL: '#',
					setupErrorCode: 'access_denied',
					setupErrorMessage:
						'Setup was interrupted because you did not grant the necessary permissions',
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
