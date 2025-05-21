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
	let originalNavigatorOnline;

	const mockOnlineStatus = ( status = true ) => {
		Object.defineProperty( navigator, 'onLine', {
			value: status,
			writable: true,
		} );
	};

	const connectionCheckEndpoint = '/google-site-kit/v1/?_locale=user';

	const connectionCheckResponse = {
		namespace: 'google-site-kit/v1',
	};

	beforeEach( () => {
		registry = createTestRegistry();

		store = registry.stores[ CORE_UI ].store;
	} );

	afterEach( () => {
		mockOnlineStatus();
	} );

	beforeAll( () => {
		originalNavigatorOnline = Object.getOwnPropertyDescriptor(
			navigator,
			'onLine'
		);
	} );

	afterAll( () => {
		Object.defineProperty( navigator, 'onLine', originalNavigatorOnline );
	} );

	it( 'should set online status correctly', () => {
		fetchMock.getOnce( connectionCheckEndpoint, {
			body: connectionCheckResponse,
		} );

		renderHook( () => useMonitorInternetConnection(), { registry } );

		expect( store.getState().isOnline ).toBe( true );
	} );

	it( 'should set offline status correctly', async () => {
		renderHook( () => useMonitorInternetConnection(), { registry } );

		await act( async () => {
			mockOnlineStatus( false );
			global.window.dispatchEvent( new Event( 'offline' ) );
			// Wait for fetch to complete.
			await waitForTimeouts( 100 );
		} );

		expect( store.getState().isOnline ).toBe( false );
	} );

	it( 'should correctly change connection status when going offline then online', async () => {
		fetchMock.get( connectionCheckEndpoint, {
			body: connectionCheckResponse,
		} );

		renderHook( () => useMonitorInternetConnection(), {
			registry,
		} );

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
		expect( fetchMock ).toHaveFetched( connectionCheckEndpoint );
	} );

	it( 'should check online status in correct interval when online', () => {
		jest.useFakeTimers();

		fetchMock.get( connectionCheckEndpoint, {
			body: connectionCheckResponse,
		} );

		renderHook( () => useMonitorInternetConnection(), { registry } );

		expect( store.getState().isOnline ).toBe( true );

		jest.advanceTimersByTime( 119999 );

		expect( fetchMock ).toHaveFetchedTimes( 0 );

		jest.advanceTimersByTime( 1 );

		// The first fetch will happen after 120000ms.
		expect( fetchMock ).toHaveFetchedTimes( 1 );
	} );

	it( 'should check online status in correct interval when offline', async () => {
		jest.useFakeTimers();

		fetchMock.get( connectionCheckEndpoint, {
			body: connectionCheckResponse,
		} );

		mockOnlineStatus( false );

		registry.dispatch( CORE_UI ).setIsOnline( false );

		renderHook( () => useMonitorInternetConnection(), { registry } );

		// The interval should be 15000ms when offline.
		jest.advanceTimersByTime( 14999 );

		// Enable online status so we can verify the interval via the fetch.
		mockOnlineStatus( true );

		// No fetch should happen when offline until the interval is reached.
		expect( fetchMock ).toHaveBeenCalledTimes( 0 );

		await act( async () => {
			jest.advanceTimersByTime( 1 );
			await new Promise( ( resolve ) => resolve() );
		} );

		expect( fetchMock ).toHaveFetchedTimes( 1 );
	} );

	it( 'should set offline status when a fetch_error occurs', async () => {
		fetchMock.getOnce( connectionCheckEndpoint, {
			throws: { code: 'fetch_error' },
		} );

		renderHook( () => useMonitorInternetConnection(), { registry } );
		mockOnlineStatus( true );

		await act( async () => {
			global.window.dispatchEvent( new Event( 'online' ) );
			await waitForTimeouts( 100 );
		} );

		expect( store.getState().isOnline ).toBe( false );
		expect( fetchMock ).toHaveFetched( connectionCheckEndpoint );
	} );
} );
