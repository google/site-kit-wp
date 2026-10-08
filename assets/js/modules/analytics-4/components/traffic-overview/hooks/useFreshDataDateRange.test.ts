/**
 * Traffic Overview `useFreshDataDateRange` hook tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import { useFreshDataDateRange } from './useFreshDataDateRange';

describe( 'useFreshDataDateRange', () => {
	let registry: WPDataRegistry;

	const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	} );

	it( 'should return a date range from the day before the reference date to the reference date when the site and the browser share a time zone', async () => {
		provideSiteInfo( registry, { timezone: browserTimezone } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			startDate: '2025-02-04',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return a date range that starts two days before the reference date when the site time zone is behind the browser time zone', async () => {
		// `Etc/GMT+12` is 12 hours behind UTC, and every other time zone is
		// ahead of `Etc/GMT+12`, so the site is behind the machine that runs
		// this test.
		provideSiteInfo( registry, { timezone: 'Etc/GMT+12' } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return a date range that starts one day before the reference date when the site time zone is ahead of the browser time zone', async () => {
		// `Pacific/Kiritimati` is 14 hours ahead of UTC, and no time zone is
		// further ahead, so the site is never behind the machine that runs
		// this test.
		provideSiteInfo( registry, { timezone: 'Pacific/Kiritimati' } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			startDate: '2025-02-04',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return a date range that starts two days before the reference date when the site uses a UTC offset and its time zone is an empty string', async () => {
		provideSiteInfo( registry, { timezone: '' } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return a date range that starts two days before the reference date when the browser does not know the site time zone', async () => {
		provideSiteInfo( registry, { timezone: 'Invalid/Timezone' } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return a date range that starts one day before the reference date when the site time zone is `undefined`', async () => {
		// The site's time zone is `undefined` until the site info loads, and
		// this test provides no site info.
		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			startDate: '2025-02-04',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return the same date range when the user selects another date range for the dashboard', async () => {
		provideSiteInfo( registry, { timezone: browserTimezone } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		act( () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );
		} );

		expect( registry.select( CORE_USER ).getDateRangeDates() ).toEqual( {
			startDate: '2025-01-30',
			endDate: '2025-02-05',
		} );
		expect( result.current ).toEqual( {
			startDate: '2025-02-04',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return a date range that ends on the new reference date when the reference date changes', async () => {
		provideSiteInfo( registry, { timezone: browserTimezone } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataDateRange(),
			{ registry }
		);

		await waitForRegistry();

		act( () => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2025-07-10' );
		} );

		expect( result.current ).toEqual( {
			startDate: '2025-07-09',
			endDate: '2025-07-10',
		} );
	} );
} );
