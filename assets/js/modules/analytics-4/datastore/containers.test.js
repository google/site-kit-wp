/**
 * `modules/analytics-4` data store: containers tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 containers', () => {
	let registry;

	const containerLookupEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/container-lookup'
	);
	const containerDestinationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/container-destinations'
	);

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		describe( 'getGoogleTagContainer', () => {
			const measurementID = 'G-2B7M8YQ1K6';
			const containerMock = fixtures.container[ measurementID ];

			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( containerLookupEndpoint, {
					body: containerMock,
					status: 200,
				} );

				const initialContainer = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( measurementID );
				expect( initialContainer ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainer( measurementID );
				expect( fetchMock ).toHaveFetched( containerLookupEndpoint );

				const container = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( measurementID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( container ).toEqual( containerMock );
			} );

			it( 'should not make a network request if a container for this measurementID is already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetGoogleTagContainer( containerMock, {
						measurementID,
					} );

				const container = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( measurementID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainer( measurementID );

				expect( fetchMock ).not.toHaveFetched(
					containerLookupEndpoint
				);
				expect( container ).toEqual( containerMock );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( containerLookupEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( measurementID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainer( measurementID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const container = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( measurementID );
				expect( container ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getGoogleTagContainerDestinations', () => {
			const gtmAccountID = '6065484567';
			const gtmContainerID = '98369876';
			const containerDestinationsMock =
				fixtures.containerDestinations[ gtmAccountID ][
					gtmContainerID
				];

			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( containerDestinationsEndpoint, {
					body: containerDestinationsMock,
					status: 200,
				} );

				const initialContainerDestinations = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainerDestinations(
						gtmAccountID,
						gtmContainerID
					);
				expect( initialContainerDestinations ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainerDestinations(
					gtmAccountID,
					gtmContainerID
				);
				expect( fetchMock ).toHaveFetched(
					containerDestinationsEndpoint
				);

				const containerDestinations = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainerDestinations(
						gtmAccountID,
						gtmContainerID
					);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( containerDestinations ).toEqual(
					containerDestinationsMock
				);
			} );

			it( 'should not make a network request if container destinations for the given accountID and containerID are already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetGoogleTagContainerDestinations(
						containerDestinationsMock,
						{
							gtmAccountID,
							gtmContainerID,
						}
					);

				const containerDestinations = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainerDestinations(
						gtmAccountID,
						gtmContainerID
					);
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainerDestinations(
					gtmAccountID,
					gtmContainerID
				);

				expect( fetchMock ).not.toHaveFetched(
					containerDestinationsEndpoint
				);
				expect( containerDestinations ).toEqual(
					containerDestinationsMock
				);
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( containerDestinationsEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainerDestinations(
						gtmAccountID,
						gtmContainerID
					);
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainerDestinations(
					gtmAccountID,
					gtmContainerID
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const containerDestinations = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainerDestinations(
						gtmAccountID,
						gtmContainerID
					);
				expect( containerDestinations ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
