/**
 * `modules/thank-with-google` datastore: publications tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	freezeFetch,
	provideSiteInfo,
	provideUserInfo,
	subscribeUntil,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import {
	MODULES_THANK_WITH_GOOGLE,
	ONBOARDING_STATE_ACTION_REQUIRED,
	ONBOARDING_STATE_COMPLETE,
	ONBOARDING_STATE_PENDING_VERIFICATION,
} from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

describe( 'modules/thank-with-google publications', () => {
	let registry;

	const publicationWithOnboardingCompleteStateA = {
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-a',
		displayName: 'Test publication title',
		verifiedDomains: [ 'https://example.com' ],
		paymentOptions: {
			thankStickers: true,
		},
		onboardingState: ONBOARDING_STATE_COMPLETE,
	};
	const publicationWithOnboardingCompleteStateB = {
		...publicationWithOnboardingCompleteStateA,
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-b',
	};
	const publicationOnboardingActionRequiredStateC = {
		...publicationWithOnboardingCompleteStateA,
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-c',
		onboardingState: ONBOARDING_STATE_ACTION_REQUIRED,
	};
	const publicationPendingVerificationD = {
		...publicationWithOnboardingCompleteStateA,
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-d',
		onboardingState: ONBOARDING_STATE_PENDING_VERIFICATION,
	};
	const publicationWithOnboardingCompleteState = [
		publicationWithOnboardingCompleteStateA,
		publicationWithOnboardingCompleteStateB,
	];

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'resetAccounts', () => {
			it( 'sets publications back to their initial values', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications(
						publicationWithOnboardingCompleteState
					);

				// Verify the defined state.
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getPublications()
				).toEqual( publicationWithOnboardingCompleteState );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.resetPublications();

				// getPublications() will trigger a request again.
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/,
					{
						body: publicationWithOnboardingCompleteState,
						status: 200,
					}
				);

				// Now it should have reverted to the initial undefined state.
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getPublications()
				).toBeUndefined();
			} );

			it( 'invalidates the resolver for getPublications', async () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications(
						publicationWithOnboardingCompleteState
					);
				registry.select( MODULES_THANK_WITH_GOOGLE ).getPublications();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.hasFinishedResolution( 'getPublications' )
				);

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.resetPublications();

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.hasFinishedResolution( 'getPublications' )
				).toBe( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getPublications', () => {
			it( 'uses a resolver to get all the publications when requested', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/,
					{
						body: publicationWithOnboardingCompleteState,
						status: 200,
					}
				);

				// The publications will be `undefined` whilst loading.
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getPublications()
				).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getPublications();

				const publications = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getPublications();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( publications ).toEqual(
					publicationWithOnboardingCompleteState
				);
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/,
					{ body: response, status: 500 }
				);

				registry.select( MODULES_THANK_WITH_GOOGLE ).getPublications();

				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getPublications();

				const publications = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getPublications();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( publications ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'returns undefined if publications is not yet available', () => {
				freezeFetch(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/
				);

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getPublications()
				).toBeUndefined();
			} );

			it( 'does not make a network request if data is already in state', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications(
						publicationWithOnboardingCompleteState
					);

				const publications = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getPublications();

				expect( fetchMock ).not.toHaveFetched();
				expect( publications ).toEqual(
					publicationWithOnboardingCompleteState
				);
			} );
		} );

		describe( 'getCurrentPublication', () => {
			it( 'returns undefined if publications is not yet available', () => {
				freezeFetch(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/
				);

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getCurrentPublication()
				).toBeUndefined();
			} );

			it( 'returns null if there are no publications', async () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( [] );

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getCurrentPublication()
				).toBeNull();
			} );

			it( 'returns the publication if that is the only one in the list', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications(
						publicationWithOnboardingCompleteState
					);

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( null );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				expect( publication ).toEqual(
					publicationWithOnboardingCompleteState[ 0 ]
				);
			} );

			it( 'returns the publication that matches the publicationID when present', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( [
						publicationWithOnboardingCompleteStateA,
						publicationWithOnboardingCompleteStateB,
					] );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( 'test-publication-b' );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				// eslint-disable-next-line sitekit/acronym-case
				expect( publication.publicationId ).toEqual(
					'test-publication-b'
				);
			} );

			it( 'returns the first publication with `ONBOARDING_COMPLETE` onboardingState when no publication matches the publicationID', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications(
						publicationWithOnboardingCompleteState
					);

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( 'test-publication--non-matching' );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				expect( publication ).toEqual(
					publicationWithOnboardingCompleteState[ 0 ]
				);
				expect( publication.onboardingState ).toBe(
					ONBOARDING_STATE_COMPLETE
				);
				// eslint-disable-next-line sitekit/acronym-case
				expect( publication.publicationId ).not.toBe(
					'test-publication--non-matching'
				);
			} );

			it( 'returns the first publication when no publication matches the publicationID or has `ONBOARDING_COMPLETE` onboardingState', () => {
				const inactivePublications = [
					publicationOnboardingActionRequiredStateC,
					publicationPendingVerificationD,
				];
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( inactivePublications );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( 'test-publication--non-matching' );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				expect( publication ).toEqual(
					publicationOnboardingActionRequiredStateC
				);
			} );
		} );

		describe( 'getServiceCreatePublicationURL', () => {
			it( 'returns an account chooser URL with the home URL appended to the publisher center URL', () => {
				provideSiteInfo( registry );
				provideUserInfo( registry );

				const homeURL = registry.select( CORE_SITE ).getHomeURL();
				const publisherCenterURL =
					'https://publishercenter.google.com/?sk_url=' +
					encodeURIComponent( homeURL );
				const expectedAccountChooserURL = registry
					.select( CORE_USER )
					.getAccountChooserURL( publisherCenterURL );

				const createPublicationURL = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getServiceCreatePublicationURL();

				expect( createPublicationURL ).toBe(
					expectedAccountChooserURL
				);
			} );
		} );

		describe( 'getServicePublicationURL', () => {
			it( 'should throw an error if no publicationID is given', () => {
				expect( () =>
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getServicePublicationURL()
				).toThrow( 'A publicationID is required.' );
			} );

			it( 'returns a publisher center URL for an existing publication', () => {
				const publicationURL = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getServicePublicationURL( 'test-publication-a' );

				expect( publicationURL ).toBe(
					'https://publishercenter.google.com/publications/test-publication-a/overview'
				);
			} );
		} );
	} );
} );
