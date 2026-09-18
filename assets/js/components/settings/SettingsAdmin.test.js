/**
 * SettingsAdmin component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import SettingsAdmin from './SettingsAdmin';

jest.mock( './SettingsCardKeyMetrics', () => {
	const { mockCreateComponent } = require( '@tests/js/mock-component-utils' );
	return mockCreateComponent( 'SettingsCardKeyMetrics' );
} );

describe( 'SettingsAdmin', () => {
	let registry;

	function provideAnalyticsConnected( connected ) {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected,
			},
		] );
	}

	function provideSitePurpose( hasPurpose ) {
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: {
				values: hasPurpose ? [ 'publish_blog' ] : [],
				scope: 'site',
			},
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		fetchMock.get( /\/google-site-kit\/v1\//, {
			body: {},
			status: 200,
		} );

		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveCapabilities( {} );
	} );

	it( 'renders the Key Metrics card when Analytics is connected', async () => {
		provideAnalyticsConnected( true );
		provideSitePurpose( false );

		const { getByText, waitForRegistry } = render( <SettingsAdmin />, {
			registry,
		} );

		await waitForRegistry();

		expect( getByText( /SettingsCardKeyMetrics/i ) ).toBeInTheDocument();
	} );

	it( 'does not render the Key Metrics card when Analytics is not connected and there is no site purpose answer', async () => {
		provideAnalyticsConnected( false );
		provideSitePurpose( false );

		const { queryByText, waitForRegistry } = render( <SettingsAdmin />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText( /SettingsCardKeyMetrics/i )
		).not.toBeInTheDocument();
	} );

	it( 'renders the Key Metrics card when Analytics is not connected but a site purpose answer exists and `setupFlowRefreshPhase4` is enabled', async () => {
		provideAnalyticsConnected( false );
		provideSitePurpose( true );

		const { getByText, waitForRegistry } = render( <SettingsAdmin />, {
			registry,
			features: [ 'setupFlowRefreshPhase4' ],
		} );

		await waitForRegistry();

		expect( getByText( /SettingsCardKeyMetrics/i ) ).toBeInTheDocument();
	} );

	it( 'does not render the Key Metrics card when a site purpose answer exists but `setupFlowRefreshPhase4` is disabled', async () => {
		provideAnalyticsConnected( false );
		provideSitePurpose( true );

		const { queryByText, waitForRegistry } = render( <SettingsAdmin />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText( /SettingsCardKeyMetrics/i )
		).not.toBeInTheDocument();
	} );
} );
