/**
 * `useFinishSetup` hook tests.
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
import { type Registry } from '@/js/googlesitekit-data';
import { deleteItem, getItem, setItem } from '@/js/googlesitekit/api/cache';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	provideSiteInfo,
	renderHook,
	waitFor,
} from '@tests/js/test-utils';
import useFinishSetup from './useFinishSetup';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

function getLocationAssignURL(): string {
	return ( global.location.assign as jest.Mock ).mock
		.calls[ 0 ][ 0 ] as string;
}

describe( 'useFinishSetup', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( async () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );
		mockTrackEvent.mockClear();
		await setItem( 'module_setup', true );
	} );

	afterEach( async () => {
		await deleteItem( 'module_setup' );
	} );

	it( 'should clear the module_setup cache when finishing setup', async () => {
		const { result } = renderHook( () => useFinishSetup( 'test-module' ), {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( ( await getItem( 'module_setup' ) ).cacheHit ).toBe( true );

		await act( async () => {
			await result.current();
		} );

		expect( ( await getItem( 'module_setup' ) ).cacheHit ).toBe( false );
	} );

	it( 'should track the standard complete_module_setup event by default', async () => {
		const { result } = renderHook( () => useFinishSetup( 'test-module' ), {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await act( async () => {
			await result.current();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'moduleSetup',
			'complete_module_setup',
			'test-module',
			undefined
		);
	} );

	it( 'should track a custom completion event when gaTrackingEventArgs is provided', async () => {
		const { result } = renderHook(
			() =>
				useFinishSetup( 'analytics-4', {
					gaTrackingEventArgs: {
						category: `${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
						action: 'setup_flow_v3_complete_analytics_step',
					},
				} ),
			{ registry, viewContext: VIEW_CONTEXT_MODULE_SETUP }
		);

		await act( async () => {
			await result.current();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
			'setup_flow_v3_complete_analytics_step',
			undefined,
			undefined
		);
	} );

	it( 'should redirect to the default dashboard URL with expected query args', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&panel=email-reporting';

		const { result } = renderHook( () => useFinishSetup( 'test-module' ), {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await act( async () => {
			await result.current();
		} );

		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalled()
		);

		const redirectURL = new URL( getLocationAssignURL() );

		expect( redirectURL.searchParams.get( 'page' ) ).toEqual(
			'googlesitekit-dashboard'
		);
		expect( redirectURL.searchParams.get( 'notification' ) ).toEqual(
			'authentication_success'
		);
		expect( redirectURL.searchParams.get( 'slug' ) ).toEqual(
			'test-module'
		);
		expect( redirectURL.searchParams.get( 'panel' ) ).toEqual(
			'email-reporting'
		);
	} );

	it( 'should preserve forwarded params for a custom redirect URL', async () => {
		const customRedirectURL =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true';

		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&panel=email-reporting';

		const { result } = renderHook( () => useFinishSetup( 'test-module' ), {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await act( async () => {
			await result.current( customRedirectURL );
		} );

		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalled()
		);

		const redirectURL = new URL( getLocationAssignURL() );

		expect( redirectURL.searchParams.get( 'page' ) ).toEqual(
			'googlesitekit-dashboard'
		);
		expect( redirectURL.searchParams.get( 'slug' ) ).toEqual(
			'analytics-4'
		);
		expect( redirectURL.searchParams.get( 'reAuth' ) ).toEqual( 'true' );
		expect( redirectURL.searchParams.get( 'panel' ) ).toEqual(
			'email-reporting'
		);
	} );

	it( 'should not override existing params in a custom redirect URL with forwarded params', async () => {
		const customRedirectURLWithNotification =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=ads&notification=ads_success';

		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&panel=email-reporting&notification=authentication_success';

		const { result } = renderHook( () => useFinishSetup( 'test-module' ), {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await act( async () => {
			await result.current( customRedirectURLWithNotification );
		} );

		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalled()
		);

		const redirectURL = new URL( getLocationAssignURL() );

		expect( redirectURL.searchParams.get( 'notification' ) ).toEqual(
			'ads_success'
		);
	} );
} );
