/**
 * `useMonitorInternetConnection` hook tests.
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
import {
	actHook as act,
	createTestRegistry,
	renderHook,
	waitForTimeouts,
} from '../../../tests/js/test-utils';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import { useMonitorInternetConnection } from './useMonitorInternetConnection';

describe( 'useMonitorInternetConnection', () => {
	let registry;
	let store;

	const mockOnlineStatus = ( status = true ) => {
		Object.defineProperty( navigator, 'onLine', {
			value: status,
			writable: true,
		} );
	};

	const healthCheckEndpoint = new RegExp(
		'google-site-kit/v1/core/site/data/health-checks'
	);

	const healthCheckResponse = {
		checks: {
			googleAPI: {
				pass: true,
				errorMsg: '',
			},
			skService: {
				pass: true,
				errorMsg: '',
			},
		},
	};

	beforeEach( () => {
		registry = createTestRegistry();

		store = registry.stores[ CORE_UI ].store;
	} );

	afterEach( () => {
		mockOnlineStatus();
	} );

	it( 'should set online status correctly', () => {
		fetchMock.getOnce( healthCheckEndpoint, {
			body: healthCheckResponse,
		} );

		renderHook( () => useMonitorInternetConnection(), { registry } );

		expect( store.getState().isOnline ).toBe( true );
	} );

	it( 'should set offline status correctly', () => {
		mockOnlineStatus( false );

		renderHook( () => useMonitorInternetConnection(), { registry } );

		expect( store.getState().isOnline ).toBe( false );
	} );

	it( 'should correctly change connection status when going offline then online', async () => {
		fetchMock.get( healthCheckEndpoint, {
			body: healthCheckResponse,
		} );

		renderHook(
			() =>
				useMonitorInternetConnection( {
					isOnline: 100,
					isOffline: 50,
				} ),
			{
				registry,
			}
		);

		// Wait for fetch to complete.
		await waitForTimeouts( 100 );

		// Initial status should be online.
		expect( store.getState().isOnline ).toBe( true );

		// Simulate going offline.
		await act( async () => {
			mockOnlineStatus( false );
			global.window.dispatchEvent( new Event( 'offline' ) );
			// Wait for fetch to complete.
			await waitForTimeouts( 100 );
		} );

		expect( store.getState().isOnline ).toBe( false );

		// Simulate going back online.
		await act( async () => {
			mockOnlineStatus();
			global.window.dispatchEvent( new Event( 'online' ) );
			// Wait for fetch to complete.
			await waitForTimeouts( 100 );
		} );

		expect( store.getState().isOnline ).toBe( true );
		expect( fetchMock ).toHaveFetched( healthCheckEndpoint );
	} );

	it( 'should check online status in correct intervals', async () => {
		fetchMock.get( healthCheckEndpoint, {
			body: healthCheckResponse,
		} );

		renderHook(
			() =>
				useMonitorInternetConnection( {
					isOnline: 100,
					isOffline: 50,
				} ),
			{ registry }
		);

		expect( store.getState().isOnline ).toBe( true );

		expect( fetchMock ).toHaveFetchedTimes( 1 );

		// Wait for 100ms interval x2 + 50ms so the responses can be processed.
		await waitForTimeouts( 250 );

		// It should have fetched 2 more times.
		expect( fetchMock ).toHaveFetchedTimes( 3 );

		// eslint-disable-next-line require-await
		await act( async () => {
			// Simulate going offline, so the interval can adapt the offline value.
			mockOnlineStatus( false );
			// Go back online so that fetch request can be made, within interval value
			// for when isOnline is false.
			mockOnlineStatus();
		} );

		// Wait for 50ms interval, + 20ms so the response can be processed.
		await waitForTimeouts( 70 );

		expect( fetchMock ).toHaveFetchedTimes( 4 );
	} );
} );
