/**
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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	provideModules,
	untilResolved,
} from '@tests/js/utils';
import { CORE_USER } from './constants';

describe( 'core/user email reporting next report', () => {
	let registry;

	const emailReportingNextReportEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/email-reporting-next-report'
	);

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'invalidateEmailReportingNextReport', () => {
			it( 'clears the cached timestamp and re-fetches on next access', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingNextReport( {
						timestamp: 1_800_000_000,
					} );

				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_800_000_000 );

				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: { timestamp: 1_900_000_000 },
				} );

				await registry
					.dispatch( CORE_USER )
					.invalidateEmailReportingNextReport();

				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( undefined );

				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingNextReportTimestamp();

				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_900_000_000 );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getEmailReportingNextReportTimestamp', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: { timestamp: 1_800_000_000 },
				} );

				const initialTimestamp = registry
					.select( CORE_USER )
					.getEmailReportingNextReportTimestamp();

				expect( initialTimestamp ).toEqual( undefined );
				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingNextReportTimestamp();

				const timestamp = registry
					.select( CORE_USER )
					.getEmailReportingNextReportTimestamp();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( timestamp ).toEqual( 1_800_000_000 );
			} );

			it( 'should not make a network request if the timestamp is already present', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingNextReport( {
						timestamp: 1_800_000_000,
					} );

				const timestamp = registry
					.select( CORE_USER )
					.getEmailReportingNextReportTimestamp();

				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingNextReportTimestamp();

				expect( fetchMock ).not.toHaveFetched();
				expect( timestamp ).toEqual( 1_800_000_000 );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( CORE_USER )
					.getEmailReportingNextReportTimestamp();
				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingNextReportTimestamp();

				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const timestamp = registry
					.select( CORE_USER )
					.getEmailReportingNextReportTimestamp();
				expect( timestamp ).toEqual( undefined );
			} );
		} );
	} );
} );
