/**
 * `useGlobalTrackingEffect` hook tests.
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
	createTestRegistry,
	provideSiteInfo,
	renderHook,
	waitForDefaultTimeouts,
} from '../../../tests/js/test-utils';
import { useGlobalTrackingEffect } from './useGlobalTrackingEffect';
import * as tracking from '../util/tracking';
import { setItem, setStorageOrder } from '../googlesitekit/api/cache';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../googlesitekit/constants';

const mockTrackEvent = jest
	.spyOn( tracking, 'trackEvent' )
	.mockImplementation( () => Promise.resolve() );

describe( 'useGlobalTrackingEffect', () => {
	let registry;

	beforeAll( () => {
		setStorageOrder( [ 'localStorage', 'sessionStorage' ] );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		mockTrackEvent.mockClear();

		provideSiteInfo( registry );
	} );

	it( 'should not track events if there is a setup error', async () => {
		provideSiteInfo( registry, {
			setupErrorCode: 'error_code',
			setupErrorMessage: 'An error occurred',
		} );

		renderHook( () => useGlobalTrackingEffect(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForDefaultTimeouts();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not track events if isUsingProxy has not resolved', async () => {
		await setItem( 'start_user_setup', true );
		await setItem( 'start_site_setup', true );

		provideSiteInfo( registry, {
			usingProxy: undefined,
		} );

		renderHook( () => useGlobalTrackingEffect(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForDefaultTimeouts();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not track events if cached items are not present', async () => {
		renderHook( () => useGlobalTrackingEffect(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForDefaultTimeouts();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should track events and remove cached items', async () => {
		await setItem( 'start_user_setup', true );
		await setItem( 'start_site_setup', true );

		renderHook( () => useGlobalTrackingEffect(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForDefaultTimeouts();

		expect( localStorage.getItem ).toHaveBeenCalled();
		expect( localStorage.removeItem ).toHaveBeenCalled();
		expect( mockTrackEvent ).toHaveBeenCalled();
	} );

	it( 'should track complete_user_setup event with correct data', async () => {
		await setItem( 'start_user_setup', true );

		renderHook( () => useGlobalTrackingEffect(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForDefaultTimeouts();

		expect( localStorage.removeItem ).toHaveBeenCalled();
		expect( mockTrackEvent ).toHaveBeenCalled();
		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_setup`,
			'complete_user_setup',
			'proxy'
		);
	} );

	it( 'should track complete_site_setup event with correct data', async () => {
		await setItem( 'start_site_setup', true );

		provideSiteInfo( registry, {
			usingProxy: false,
		} );

		renderHook( () => useGlobalTrackingEffect(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForDefaultTimeouts();

		expect( localStorage.removeItem ).toHaveBeenCalled();
		expect( mockTrackEvent ).toHaveBeenCalled();
		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_setup`,
			'complete_site_setup',
			'custom-oauth'
		);
	} );
} );
