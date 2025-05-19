/* eslint-disable sitekit/acronym-case */
/**
 * `modules/reader-revenue-manager` data store: publications tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	untilResolved,
	provideModules,
	provideUserInfo,
	provideModuleRegistrations,
	muteFetch,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { enabledFeatures } from '../../../features';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	PUBLICATION_ONBOARDING_STATES,
} from './constants';
import { cloneDeep } from 'lodash';

describe( 'modules/reader-revenue-manager publications', () => {
	let registry;

	const getModulesEndpoint = new RegExp(
		'^/google-site-kit/v1/core/modules/data/list'
	);

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);

	const syncOnboardingStateEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/sync-publication-onboarding-state'
	);

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		enabledFeatures.add( 'rrmModule' ); // Enable RRM module to get its features.
		registry = createTestRegistry();
		provideUserInfo( registry );
	} );

	describe( 'actions', () => {
		beforeEach( () => {
			// Make sure the RRM module is active and connected.
			const extraData = [
				{
					slug: READER_REVENUE_MANAGER_MODULE_SLUG,
					active: true,
					connected: true,
				},
			];
			provideModules( registry, extraData );
			provideModuleRegistrations( registry, extraData );
		} );

		describe( 'syncPublicationOnboardingState', () => {
			it( 'should return undefined when no publication ID is present', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {} );

				const syncStatus = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				expect( syncStatus ).toEqual( {} );
			} );

			it( 'should call the `sync-publication-onboarding-state` endpoint and update the settings in state', async () => {
				const publication = fixtures.publications[ 0 ];

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
				};

				fetchMock.postOnce( syncOnboardingStateEndpoint, {
					body: {
						publicationID: publication.publicationId,
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.UNSPECIFIED,
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				// Set expectations for settings endpoint.
				expect( fetchMock ).toHaveFetched(
					syncOnboardingStateEndpoint
				);

				// Set expectations for publication ID.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toEqual( 'ABCDEFGH' );

				// Set expectations for publication onboarding state.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toEqual( PUBLICATION_ONBOARDING_STATES.UNSPECIFIED );
			} );
		} );

		describe( 'findMatchedPublication', () => {
			it( 'should return null if there are no publications', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [] );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toBeNull();
			} );

			it( 'should return the publication if that is the only one in the list', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [ fixtures.publications[ 0 ] ] );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( fixtures.publications[ 0 ] );
			} );

			it( 'should return the publication with ONBOARDING_COMPLETE if more than one publication exists', async () => {
				const completedOnboardingPublication =
					fixtures.publications.find(
						( publication ) =>
							publication.onboardingState ===
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
					);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( completedOnboardingPublication );
			} );

			it( 'should return the first publication if none have ONBOARDING_COMPLETE', async () => {
				const publications = fixtures.publications.map(
					( publication ) => ( {
						...publication,
						onboardingState:
							PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					} )
				);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( publications[ 0 ] );
			} );
		} );

		describe( 'resetPublications', () => {
			it( 'should reset the publications data in the store', async () => {
				const response = fixtures.publications.slice( 0, 2 );
				fetchMock.getOnce( publicationsEndpoint, {
					body: response,
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.resetPublications();

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();

				expect( fetchMock ).toHaveFetched();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				).toEqual( response );
			} );
		} );

		describe( 'selectPublication', () => {
			it( 'should throw an error if a publication object is not provided', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.selectPublication()
				).toThrow( 'A valid publication object is required.' );
			} );

			it.each( [ 'publicationId', 'onboardingState' ] )(
				'should throw an error if the publication object does not contain %s',
				( key ) => {
					const publication = {
						publicationPredicates: {},
						verifiedDomains: [],
					};

					switch ( key ) {
						case 'publicationId':
							publication.onboardingState = '';
							break;
						case 'onboardingState':
							publication.publicationId = '';
							break;
					}

					expect( () =>
						registry
							.dispatch( MODULES_READER_REVENUE_MANAGER )
							.selectPublication( publication )
					).toThrow( `The publication object must contain ${ key }` );
				}
			);

			it( 'should set the given publication in state', () => {
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toBeUndefined();
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toBeUndefined();

				const [ publicationId, onboardingState ] = [
					'publication-id',
					'onboarding-state',
				];

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId,
						onboardingState,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toEqual( publicationId );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toEqual( onboardingState );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateChanged()
				).toEqual( false );
			} );

			it( 'should set the product IDs in state when products are provided', () => {
				const products = [
					{ name: 'ABC:product-1' },
					{ name: 'DEF:product-2' },
				];
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductIDs()
				).toEqual( [ 'ABC:product-1', 'DEF:product-2' ] );
			} );

			it( 'should set an empty product IDs array when products array is empty', () => {
				const products = [];
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductIDs()
				).toEqual( [] );
			} );

			it( 'should handle products with a missing name property', () => {
				const products = [
					{ name: 'ABC:product-1' },
					{}, // Missing name
					{ name: 'DEF:product-2' },
				];
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductIDs()
				).toEqual( [ 'ABC:product-1', 'DEF:product-2' ] );
			} );

			it( 'should set the payment option in state when a payment option is provided', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions: {
							contributions: null,
							subscriptions: true,
							noPayment: null,
							thankStickers: null,
						},
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( 'subscriptions' );
			} );

			it( 'should set the first true payment option when multiple options are provided', () => {
				const paymentOptions = {
					subscriptions: null,
					contributions: true,
					noPayment: true,
					thankStickers: null,
				};
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( 'contributions' );
			} );

			it( 'should default to an empty string when all payment options are null', () => {
				const paymentOptions = {
					subscriptions: null,
					contributions: null,
					noPayment: null,
					thankStickers: null,
				};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( '' );
			} );

			it( 'should default to an empty string when the payment options object is empty', () => {
				const paymentOptions = {};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( '' );
			} );

			it( 'should set productID to "openaccess" when different publication is selected', () => {
				const products = [
					{ name: 'ABC:product-1' },
					{ name: 'DEF:product-2' },
				];
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductID()
				).toEqual( 'openaccess' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			provideModules( registry );
			provideModuleRegistrations( registry );
		} );

		describe( 'getPublications', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( publicationsEndpoint, {
					body: fixtures.publications,
					status: 200,
				} );

				fetchMock.get( getModulesEndpoint, {
					body: undefined,
					status: 200,
				} );

				const initialPublications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( initialPublications ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
				expect( fetchMock ).toHaveFetched( publicationsEndpoint );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( publications ).toEqual( fixtures.publications );
				expect( publications ).toHaveLength(
					fixtures.publications.length
				);
			} );

			it( 'should not make a network request if publications are already present', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();

				expect( fetchMock ).not.toHaveFetched( publicationsEndpoint );
				expect( publications ).toEqual( fixtures.publications );
				expect( publications ).toHaveLength(
					fixtures.publications.length
				);
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( publicationsEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( publications ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getCurrentProductIDs', () => {
			it( 'should return undefined if publications are not loaded', async () => {
				muteFetch( publicationsEndpoint );

				const productIDs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getCurrentProductIDs();
				expect( productIDs ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
			} );

			it( 'should return empty array if no publications are not available', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setSettings( {
						publicationID: '',
						publicationOnboardingState: '',
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [] );

				const productIDs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getCurrentProductIDs();
				expect( productIDs ).toEqual( [] );
			} );

			it( 'should return products for the current publication', () => {
				const publications = cloneDeep( fixtures.publications );
				publications[ 0 ].products = [
					{ name: 'ABC:product-1' },
					{ name: 'DEF:product-2' },
					{ name: 'GHI:product-3' },
				];
				publications[ 1 ].products = [
					{ name: 'JKL:product-4' },
					{ name: 'MNO:product-5' },
				];

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setSettings( {
						publicationID: publications[ 0 ].publicationId,
						publicationOnboardingState: 'onboarding-state',
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				const productIDs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getCurrentProductIDs();
				expect( productIDs ).toEqual( [
					'ABC:product-1',
					'DEF:product-2',
					'GHI:product-3',
				] );
			} );
		} );
	} );
} );
