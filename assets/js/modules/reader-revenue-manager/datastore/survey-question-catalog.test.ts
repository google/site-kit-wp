/**
 * `modules/reader-revenue-manager` data store: survey question catalog tests.
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
import { enabledFeatures } from '@/js/features';
import {
	createTestRegistry,
	freezeFetch,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import { type SurveyQuestion } from './types';

describe( 'modules/reader-revenue-manager survey question catalog', () => {
	let registry: WPDataRegistry;

	const surveyQuestionCatalogEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/survey-question-catalog'
	);
	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	const params = {
		organizationID: 'ABCD1234',
		publicationID: 'ABCD_123-4',
	};

	const otherParams = {
		organizationID: 'WXYZ5678',
		publicationID: 'WXYZ_567-8',
	};

	const questions: SurveyQuestion[] = [
		{
			id: 3,
			label: 'Which topics interest you?',
			answers: [
				{ id: 12, label: 'Sports' },
				{ id: 4, label: 'Technology' },
			],
			hasConfigurableAnswers: true,
		},
		{
			id: 1,
			label: 'What is your age range?',
			answers: [
				{ id: 2, label: '18-24' },
				{ id: 1, label: '25-34' },
			],
			hasConfigurableAnswers: false,
		},
	];

	const otherQuestions: SurveyQuestion[] = [
		{
			id: 7,
			label: 'What is your employment status?',
			answers: [ { id: 5, label: 'Employed' } ],
			hasConfigurableAnswers: false,
		},
	];

	/**
	 * Waits for the catalog of the given publication to resolve.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} publication                Publication identifiers.
	 * @param {string} publication.organizationID Organization ID.
	 * @param {string} publication.publicationID  Publication ID.
	 * @return {Promise} Resolves once the catalog has resolved.
	 */
	function untilCatalogResolved( {
		organizationID,
		publicationID,
	}: typeof params ) {
		return untilResolved(
			registry,
			MODULES_READER_REVENUE_MANAGER
		).getPublicationSurveyQuestionCatalog( organizationID, publicationID );
	}

	beforeEach( () => {
		enabledFeatures.add( 'rrmExpressSetup' );
		enabledFeatures.add( 'rrmSurveyCTA' );
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( params );
	} );

	describe( 'selectors', () => {
		describe( 'getPublicationSurveyQuestionCatalog', () => {
			it( 'should return the catalog stored under the given publication', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationSurveyQuestionCatalog(
						questions,
						params
					);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationSurveyQuestionCatalog(
							params.organizationID,
							params.publicationID
						)
				).toEqual( questions );
			} );

			it( 'should associate a catalog fetch error with the request identifiers', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await untilCatalogResolved( params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForSelector(
							'getPublicationSurveyQuestionCatalog',
							[ params.organizationID, params.publicationID ]
						)
				).toMatchObject( response );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getSurveyQuestionCatalog', () => {
			it( 'should return `undefined` while loading, then the catalog of the publication in the settings', async () => {
				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: questions,
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				await untilCatalogResolved( params );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					surveyQuestionCatalogEndpoint,
					{ query: params }
				);
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );
			} );

			it( 'should send no language code', async () => {
				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: questions,
					status: 200,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await untilCatalogResolved( params );

				const [ url ] = fetchMock.calls(
					surveyQuestionCatalogEndpoint
				)[ 0 ];

				expect( url ).not.toContain( 'languageCode' );
			} );

			it( 'should not fetch the catalog before the settings load', async () => {
				registry = createTestRegistry();
				freezeFetch( settingsEndpoint );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should not fetch the catalog when no publication is connected', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( '' );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should not fetch a catalog that is already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationSurveyQuestionCatalog(
						questions,
						params
					);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );

				await untilCatalogResolved( params );

				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should not fetch the catalog when an empty catalog is already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationSurveyQuestionCatalog( [], params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( [] );

				await untilCatalogResolved( params );

				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should send one request when called several times', async () => {
				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: questions,
					status: 200,
				} );

				const select = registry.select(
					MODULES_READER_REVENUE_MANAGER
				);

				select.getSurveyQuestionCatalog();
				select.getSurveyQuestionCatalog();

				await untilCatalogResolved( params );

				select.getSurveyQuestionCatalog();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should keep the catalogs of different publications separate', () => {
				const dispatch = registry.dispatch(
					MODULES_READER_REVENUE_MANAGER
				);

				dispatch.receiveGetPublicationSurveyQuestionCatalog(
					questions,
					params
				);
				dispatch.receiveGetPublicationSurveyQuestionCatalog(
					otherQuestions,
					otherParams
				);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationSurveyQuestionCatalog(
							otherParams.organizationID,
							otherParams.publicationID
						)
				).toEqual( otherQuestions );
			} );

			it( 'should fetch the catalog of a newly selected publication', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationSurveyQuestionCatalog(
						questions,
						params
					);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setSettings( otherParams );

				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: otherQuestions,
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				await untilCatalogResolved( otherParams );

				expect( fetchMock ).toHaveFetched(
					surveyQuestionCatalogEndpoint,
					{ query: otherParams }
				);
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( otherQuestions );
			} );

			it( 'should return the catalog again when the publication is selected back', async () => {
				const dispatch = registry.dispatch(
					MODULES_READER_REVENUE_MANAGER
				);

				dispatch.receiveGetPublicationSurveyQuestionCatalog(
					questions,
					params
				);
				dispatch.receiveGetPublicationSurveyQuestionCatalog(
					otherQuestions,
					otherParams
				);

				dispatch.setSettings( otherParams );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( otherQuestions );

				dispatch.setSettings( params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );

				await waitForDefaultTimeouts();

				// Both publications' catalogs are already loaded.
				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should read the organization from the publications list for settings without one', async () => {
				registry = createTestRegistry();
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: params.publicationID,
					} );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [
						{
							// eslint-disable-next-line sitekit/acronym-case
							publicationId: params.publicationID,
							// eslint-disable-next-line sitekit/acronym-case
							organizationId: params.organizationID,
						},
					] );

				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: questions,
					status: 200,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await untilCatalogResolved( params );

				expect( fetchMock ).toHaveFetched(
					surveyQuestionCatalogEndpoint,
					{ query: params }
				);
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );
			} );
		} );
	} );
} );
