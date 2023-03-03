/**
 * GoogleTagIDMismatchNotification component tests.
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
import GoogleTagIDMismatchNotification from './GoogleTagIDMismatchNotification';
import {
	act,
	render,
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../tests/js/test-utils';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import * as fixtures from '../../modules/analytics-4/datastore/__fixtures__';

describe( 'GoogleTagIDMismatchNotification', () => {
	let registry;

	const gtmAccountID = '6065484567';
	const gtmContainerID = '98369876';
	const containerDestinationsMock =
		fixtures.containerDestinations[ gtmAccountID ][ gtmContainerID ];

	const containerDestinationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/container-destinations'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setGoogleTagAccountID( gtmAccountID );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setGoogleTagContainerID( gtmContainerID );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should not render BannerNotification if mismatched Google Tag IDs do not exist', () => {
		const { container } = render( <GoogleTagIDMismatchNotification />, {
			registry,
		} );

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'dispatches a request to get all mismatched Google Tag IDs', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setHasMismatchedGoogleTagID( true );

		fetchMock.get( containerDestinationsEndpoint, {
			body: containerDestinationsMock,
			status: 200,
		} );

		const { container } = render( <GoogleTagIDMismatchNotification />, {
			registry,
		} );

		await act( async () => {
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getGoogleTagContainerDestinations( gtmAccountID, gtmContainerID );

			expect( fetchMock ).toHaveFetched( containerDestinationsEndpoint );
		} );

		expect( container ).toHaveTextContent( 'Google Tag ID mismatch' );
	} );
} );
