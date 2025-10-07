/**
 * Analytics useAllTrafficWidgetReport custom hook tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { ERROR_INTERNAL_SERVER_ERROR } from '@/js/util/errors';
import { actHook, renderHook } from '../../../../../tests/js/test-utils';
import { createTestRegistry, freezeFetch } from '../../../../../tests/js/utils';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import useAllTrafficWidgetReport from './useAllTrafficWidgetReport';

describe( 'useAllTrafficWidgetReport', () => {
	let registry;

	const reportEndpoint = new RegExp(
		'/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).setReferenceDate( '2023-01-29' );
	} );

	it( 'should return the report loading state', async () => {
		freezeFetch( reportEndpoint );

		const { result } = await renderHook(
			() => useAllTrafficWidgetReport(),
			{
				registry,
			}
		);

		expect( result.current.loaded ).toBe( false );
	} );

	it( 'should return the report error', async () => {
		const errorResponse = {
			code: ERROR_INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			data: { reason: ERROR_INTERNAL_SERVER_ERROR },
		};

		fetchMock.get( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		let result;

		await actHook( async () => {
			( { result } = await renderHook(
				() => useAllTrafficWidgetReport(),
				{
					registry,
				}
			) );
		} );

		expect( console ).toHaveErrored();
		expect( result.current.error ).toEqual( errorResponse );
		expect( result.current.loaded ).toBe( true );
	} );

	it( 'should return the report response', async () => {
		const reportArgs = {
			startDate: '2023-01-01',
			endDate: '2023-01-28',
			metrics: [ { name: 'totalUsers' } ],
		};

		const reportResponse = getAnalytics4MockResponse( reportArgs );

		fetchMock.get( reportEndpoint, {
			body: reportResponse,
			status: 200,
		} );

		let result;

		await actHook( async () => {
			( { result } = await renderHook(
				() => useAllTrafficWidgetReport(),
				{
					registry,
				}
			) );
		} );

		expect( result.current.report ).toEqual( reportResponse );
		expect( result.current.loaded ).toBe( true );
	} );
} );
