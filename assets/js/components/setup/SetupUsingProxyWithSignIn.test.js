/**
 * SetupUsingProxyWithSignIn component tests.
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

import {
	render,
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	provideUserInfo,
	provideUserCapabilities,
	muteFetch,
} from '../../../../tests/js/test-utils';
import coreModulesFixture from '../../googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import SetupUsingProxyWithSignIn from './SetupUsingProxyWithSignIn';
import { VIEW_CONTEXT_SPLASH } from '../../googlesitekit/constants';

jest.mock(
	'./CompatibilityChecks',
	() =>
		( { children } ) =>
			children( { complete: true } )
);

describe( 'SetupUsingProxyWithSignIn', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/connection' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/tracking' )
		);
	} );

	it( 'should render the setup page, including the Activate Analytics notice', () => {
		const { container, getByText } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByText( /Connect Google Analytics as part of your setup/ )
		).toBeInTheDocument();
	} );

	it( 'should not render the Activate Analytics notice when the Analytics module is not available', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				coreModulesFixture.filter(
					( { slug } ) => slug !== 'analytics-4'
				)
			);

		const { waitForRegistry, container, queryByText } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Connect Google Analytics as part of your setup/ )
		).not.toBeInTheDocument();
	} );
} );
