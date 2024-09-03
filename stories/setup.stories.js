/**
 * Setup Stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import SetupUsingGCP from '../assets/js/components/legacy-setup/SetupUsingGCP';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	provideUserAuthentication,
	provideUserCapabilities,
	WithTestRegistry,
} from '../tests/js/utils';
import { Provider as ViewContextProvider } from '../assets/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../assets/js/googlesitekit/constants';

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: false } );

	return <Story registry={ registry } />;
};

storiesOf( 'Setup / Using GCP', module ).add(
	'Step one',
	( args, { registry } ) => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;
		global._googlesitekitLegacyData.setup.isAuthenticated = false;
		global._googlesitekitLegacyData.setup.isVerified = false;
		global._googlesitekitLegacyData.setup.hasSearchConsoleProperty = false;

		provideUserAuthentication( registry, {
			authenticated: false,
		} );

		provideUserCapabilities( registry );

		return (
			<WithTestRegistry registry={ registry }>
				<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
					<SetupUsingGCP />
				</ViewContextProvider>
			</WithTestRegistry>
		);
	},
	{
		decorators: [ withRegistry ],
		padding: 0,
	}
);
