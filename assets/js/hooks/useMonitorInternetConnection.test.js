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
		expect( fetchMock ).toHaveFetched( healthCheckEndpoint );
	} );

	it( 'should check online status in correct interval when online', () => {
		jest.useFakeTimers();

		fetchMock.get( healthCheckEndpoint, {
			body: healthCheckResponse,
		} );

		renderHook( () => useMonitorInternetConnection(), { registry } );

		expect( store.getState().isOnline ).toBe( true );

		// The initial fetch will happen immediately.
		expect( fetchMock ).toHaveFetchedTimes( 1 );

		jest.advanceTimersByTime( 119999 );

		expect( fetchMock ).toHaveFetchedTimes( 1 );

		jest.advanceTimersByTime( 1 );

		// The second fetch will happen after 120000ms.
		expect( fetchMock ).toHaveFetchedTimes( 2 );
	} );

	it( 'should check online status in correct interval when offline', () => {
		jest.useFakeTimers();

		fetchMock.get( healthCheckEndpoint, {
			body: healthCheckResponse,
		} );

		mockOnlineStatus( false );

		renderHook( () => useMonitorInternetConnection(), { registry } );

		expect( store.getState().isOnline ).toBe( false );

		jest.advanceTimersByTime( 15000 );

		// When `isOnline` is `false`, request should not be made,
		// only state is updated.
		expect( fetchMock ).toHaveBeenCalledTimes( 0 );
	} );
} );
