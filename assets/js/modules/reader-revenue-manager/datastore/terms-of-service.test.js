/**
 * `modules/reader-revenue-manager` data store: Terms of Service tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	untilResolved,
} from '@tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

describe( 'modules/reader-revenue-manager Terms of Service', () => {
	let registry;

	const termsOfServiceEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/terms-of-service'
	);

	const params = {
		tosURL: 'https://example.com/terms',
	};

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		provideModuleRegistrations( registry );
	} );

	it( 'should use a resolver to fetch the Terms of Service', async () => {
		const termsOfService = '<h1>Terms of Service</h1>';
		fetchMock.getOnce( termsOfServiceEndpoint, {
			body: JSON.stringify( termsOfService ),
			status: 200,
		} );

		expect(
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getTermsOfService( params )
		).toBeUndefined();

		await untilResolved(
			registry,
			MODULES_READER_REVENUE_MANAGER
		).getTermsOfService( params );

		expect( fetchMock ).toHaveFetched( termsOfServiceEndpoint );
		expect(
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getTermsOfService( params )
		).toBe( termsOfService );
	} );

	it( 'should not fetch Terms of Service already in state', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetTermsOfService( '<h1>Terms</h1>', params );

		registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getTermsOfService( params );

		await untilResolved(
			registry,
			MODULES_READER_REVENUE_MANAGER
		).getTermsOfService( params );

		expect( fetchMock ).not.toHaveFetched( termsOfServiceEndpoint );
	} );
} );
