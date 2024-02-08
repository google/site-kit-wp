/**
 * AuthenticatedPermissionsModal Component Stories.
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
import AuthenticatedPermissionsModal from './AuthenticatedPermissionsModal';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideUserAuthentication } from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

function Template() {
	return <AuthenticatedPermissionsModal />;
}

export const Default = Template.bind( {} );
Default.storyName = 'AuthenticatedPermissionsModal';
Default.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
			registry.dispatch( CORE_USER ).setPermissionScopeError( {
				status: 500,
				message:
					'You’ll need to contact your administrator. Trouble getting access?',
				data: {
					scopes: [
						'https://www.googleapis.com/auth/analytics.readonly',
					],
				},
			} );
			provideUserAuthentication( registry );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Components/AuthenticatedPermissionsModal',
	component: AuthenticatedPermissionsModal,
};
