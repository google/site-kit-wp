/**
 * `modules/reader-revenue-manager` data store: CTAs tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { createTestRegistry, untilResolved } from '@tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

describe( 'modules/reader-revenue-manager CTAs', () => {
	let registry: WPDataRegistry;

	const ctasEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
	);
	const createCTAEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-cta'
	);

	const params = {
		organizationID: 'ABCD1234',
		publicationID: 'ABCD_123-4',
	};

	const newsletterConfig = { title: 'Subscribe to our newsletter' };

	const cta = {
		name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/1',
		type: 'NEWSLETTER_SIGNUP',
	};

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'createCTA', () => {
			it( 'should create the CTA and return the response', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( { ...params, newsletterConfig } );

				expect( response ).toEqual( cta );
				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
					body: {
						data: { ...params, newsletterConfig },
					},
				} );
			} );

			it( 'should set an action error when the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.postOnce( createCTAEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( { ...params, newsletterConfig } );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForAction( 'createCTA', [] )
				).toEqual( errorResponse );
			} );

			it( 'should validate the parameters', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							publicationID: 'ABCD_123-4',
							newsletterConfig,
						} )
				).toThrow( 'organizationID is required and must be a string.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							organizationID: 'ABCD1234',
							newsletterConfig,
						} )
				).toThrow( 'publicationID is required and must be a string.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( { ...params } )
				).toThrow(
					'newsletterConfig is required and must be an object.'
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getCTAs', () => {
			it( 'should fetch the CTAs when they are not loaded', async () => {
				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta ],
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( params )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs( params );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( params )
				).toEqual( [ cta ] );
			} );

			it( 'should not fetch CTAs that are already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( [ cta ], params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( params )
				).toEqual( [ cta ] );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs( params );

				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );
		} );
	} );
} );
