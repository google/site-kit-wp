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
} from '../../../../../tests/js/test-utils';
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import SetupUsingProxyWithSignIn from '@/js/components/setup/SetupUsingProxyWithSignIn';
import { VIEW_CONTEXT_SPLASH } from '@/js/googlesitekit/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { enabledFeatures } from '@/js/features';

jest.mock(
	'../CompatibilityChecks',
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
		const { getByText } = render( <SetupUsingProxyWithSignIn />, {
			registry,
			viewContext: VIEW_CONTEXT_SPLASH,
		} );

		expect(
			getByText( /Connect Google Analytics as part of your setup/ )
		).toBeInTheDocument();
	} );

	it( 'should not render the Activate Analytics notice when the Analytics module is not available', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				coreModulesFixture.filter(
					( { slug } ) => slug !== MODULE_SLUG_ANALYTICS_4
				)
			);

		const { waitForRegistry, queryByText } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		expect(
			queryByText( /Connect Google Analytics as part of your setup/ )
		).not.toBeInTheDocument();
	} );

	describe( 'Refresh setup flow', () => {
		beforeAll( () => {
			enabledFeatures.add( 'setupFlowRefresh' );
		} );

		it( 'should render the setup page without the Activate Analytics notice when the Analytics module is inactive', async () => {
			registry.dispatch( CORE_MODULES ).receiveGetModules(
				coreModulesFixture.map( ( module ) => {
					if ( MODULE_SLUG_ANALYTICS_4 === module.slug ) {
						return {
							...module,
							active: false,
						};
					}
					return module;
				} )
			);

			const { waitForRegistry, queryByText } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
				}
			);

			await waitForRegistry();

			expect(
				queryByText(
					/Get visitor insights by connecting Google Analytics as part of setup/
				)
			).not.toBeInTheDocument();
		} );

		it( 'should not render the activate analytics checkbox when the Analytics module is already active', async () => {
			registry.dispatch( CORE_MODULES ).receiveGetModules(
				coreModulesFixture.map( ( module ) => {
					if ( MODULE_SLUG_ANALYTICS_4 === module.slug ) {
						return {
							...module,
							active: true,
						};
					}
					return module;
				} )
			);

			const { waitForRegistry, queryByText } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
				}
			);

			await waitForRegistry();

			expect(
				queryByText(
					/Get visitor insights by connecting Google Analytics as part of setup/
				)
			).not.toBeInTheDocument();
		} );
	} );
} );
