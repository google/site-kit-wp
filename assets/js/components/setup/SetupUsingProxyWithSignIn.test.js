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

jest.mock( './CompatibilityChecks', () => ( { children } ) =>
	children( { complete: true } )
);

describe( 'SetupUsingProxyWithSignIn', () => {
	let registry;
	// const homeURL = 'http://example.com';

	beforeEach( () => {
		// jest.useFakeTimers();
		registry = createTestRegistry();
		provideModules( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		// provideSiteConnection( registry );

		// CompatibilityChecks setup
		// Mock global.location.hostname with value that won't throw error in first check.
		// Object.defineProperty( global.window, 'location', {
		// 	value: {
		// 		hostname: 'validurl.tld',
		// 	},
		// 	writable: true,
		// } );

		// provideSiteInfo( registry, { homeURL } );

		// const token = 'test-token-value';

		// // Mock request to setup-tag.
		// fetchMock.postOnce(
		// 	/^\/google-site-kit\/v1\/core\/site\/data\/setup-tag/,
		// 	{ body: { token }, status: 200 }
		// );

		// // Mock request to setup-tag.
		// fetchMock.postOnce( homeURL, { body: { token }, status: 200 } );

		// // Mock request to health-checks.
		// fetchMock.getOnce(
		// 	/^\/google-site-kit\/v1\/core\/site\/data\/health-checks/,
		// 	{ body: { checks: { googleAPI: { pass: true } } }, status: 200 }
		// );

		// // Mock request to AMP project.
		// muteFetch( AMP_PROJECT_TEST_URL );
		// muteFetch(
		// 	/^\/google-site-kit\/v1\/core\/site\/data\/developer-plugin/
		// );
		muteFetch( /^\/google-site-kit\/v1\/core\/site\/data\/connection/ );

		muteFetch( /^\/google-site-kit\/v1\/core\/user\/data\/tracking/ );

		// // Mock getExistingTag request
		// fetchMock.get(
		// 	{ query: { tagverify: '1' } },
		// 	{
		// 		body: `<html><head><meta name="googlesitekit-setup" content="${ token }"/></head><body></body>`,
		// 		status: 200,
		// 	}
		// );
	} );

	it( 'should render the setup page, including the Activate Analytics notice', () => {
		const { container, getByText } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
			}
		);

		// await waitForElementToBeRemoved(
		// 	document.querySelector( '.mdc-linear-progress' )
		// );

		expect( container ).toMatchSnapshot();

		expect(
			getByText( /Connect Google Analytics as part of your setup/ )
		).toBeInTheDocument();
	} );

	it( 'should not render the Activate Analytics notice when the Analytics module is not available', () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				coreModulesFixture.filter(
					( { slug } ) => slug !== 'analytics'
				)
			);

		const { container, queryByText } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Connect Google Analytics as part of your setup/ )
		).not.toBeInTheDocument();
	} );
} );
