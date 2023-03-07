/**
 * Analytics SetupForm component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';
import {
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';

const { accounts } = fixtures.accountsPropertiesProfiles;

function Template() {
	return <ModuleSetup moduleSlug="analytics" />;
}

export const WithPermissionError = Template.bind( null );
WithPermissionError.storyName = 'With permission non-retryable error';
WithPermissionError.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ANALYTICS ).receiveError(
				{
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
					},

					storeName: MODULES_ANALYTICS,
				},
				'receiveGetAccounts',
				[]
			);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Analytics/Setup/SetupForm',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetAccounts( accounts );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
