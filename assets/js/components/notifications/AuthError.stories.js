/**
 * AuthError Component Stories.
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
import { provideUserAuthentication } from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import AuthError from './AuthError';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

const NotificationWithComponentProps =
	withNotificationComponentProps( 'auth-error' )( AuthError );

function Template() {
	return <NotificationWithComponentProps />;
}

export const AuthenticationError = Template.bind( {} );
AuthenticationError.storyName = 'AuthError';
AuthenticationError.scenario = {
	label: 'Components/Notifications/Banners/AuthError',
};

export default {
	title: 'Components/Notifications/Banners',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );

				const authError = {
					code: 'missing_delegation_consent',
					status: 401,
					message:
						'Looks like your site is not allowed access to Google account data and can’t display stats in the dashboard.',
					data: {
						reconnectURL: 'https://example.com/',
					},
				};

				registry.dispatch( CORE_USER ).setAuthError( authError );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
