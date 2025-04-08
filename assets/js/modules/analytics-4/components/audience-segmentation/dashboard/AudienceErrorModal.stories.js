/**
 * AudienceErrorModal Component Stories.
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
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import {
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../../../tests/js/test-utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import AudienceErrorModal from './AudienceErrorModal';

function Template( args ) {
	return <AudienceErrorModal { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	onRetry: () => {},
};

export const WithInsufficientPermissionsError = Template.bind( {} );
WithInsufficientPermissionsError.storyName = 'Insufficient permissions error';
WithInsufficientPermissionsError.args = {
	apiErrors: {
		code: 'test_error',
		message: 'Error message.',
		data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
	},
};

export const WithOAuthError = Template.bind( {} );
WithOAuthError.storyName = 'OAuth error';
WithOAuthError.args = {
	hasOAuthError: true,
	onRetry: () => {},
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceErrorModal',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				provideModules( registry );
				provideModuleRegistrations( registry );

				// This is necessary to populate the service entity access URL.
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID: '12345',
					propertyID: '34567',
					measurementID: '56789',
					webDataStreamID: '78901',
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
