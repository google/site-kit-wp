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

	const connectedPublication = {
		organizationID: 'ABCD1234',
		publicationID: 'ABCD_123-4',
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

	/**
	 * Connects a publication by receiving it as the saved settings.
	 *
	 * The settings are also set, as a save does, since received settings do
	 * not replace settings that are already in the store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} settings Settings to receive.
	 * @return {void}
	 */
	function connectPublication(
		settings: Record< string, unknown > = connectedPublication
	) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( settings );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setSettings( settings );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		connectPublication();
	} );

	const otherPublication = {
		organizationID: 'WXYZ5678',
		publicationID: 'WXYZ_567-8',
	};

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
	 * @param {string} publicationID Publication ID.
	 * @return {Promise} Resolves once the catalog has resolved.
	 */
	function untilCatalogResolved( publicationID: string ) {
		return untilResolved(
			registry,
			MODULES_READER_REVENUE_MANAGER
		).getPublicationSurveyQuestionCatalog( publicationID );
	}

	describe( 'selectors', () => {
		describe( 'getSurveyQuestionCatalog', () => {
			it( 'should return undefined while loading, then the catalog questions', async () => {
				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: {
						publicationID: connectedPublication.publicationID,
						questions,
					},
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				await untilCatalogResolved(
					connectedPublication.publicationID
				);

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					surveyQuestionCatalogEndpoint
				);
				// eslint-disable-next-line sitekit/acronym-case -- `lastUrl` is a fetch-mock method.
				const requestURL = fetchMock.lastUrl() as string;

				expect( requestURL ).not.toMatch( /organizationID/ );
				expect( requestURL ).not.toMatch( /publicationID/ );
				expect( requestURL ).not.toMatch( /languageCode/ );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );
			} );

			it( 'should store the error of a failed request for the selector', async () => {
				const error = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: error,
					status: 500,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await untilCatalogResolved(
					connectedPublication.publicationID
				);

				expect( console ).toHaveErrored();
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForSelector( 'getSurveyQuestionCatalog', [] )
				).toMatchObject( error );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();
			} );

			it( 'should store a response under the publication it names', () => {
				// A different publication is connected by the time the
				// response lands.
				connectPublication( otherPublication );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSurveyQuestionCatalog( {
						publicationID: connectedPublication.publicationID,
						questions,
					} );

				const select = registry.select(
					MODULES_READER_REVENUE_MANAGER
				);

				// Connecting the publication the response named shows its
				// catalog, without a request.
				connectPublication();

				expect( select.getSurveyQuestionCatalog() ).toEqual(
					questions
				);
				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should not fetch the catalog before the settings have loaded', async () => {
				registry = createTestRegistry();
				freezeFetch( settingsEndpoint );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched( settingsEndpoint );
				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should not fetch the catalog when no publication is connected', async () => {
				connectPublication( {
					organizationID: '',
					publicationID: '',
				} );

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

			it( 'should not fetch the catalog while a different publication is selected', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( otherPublication.publicationID );

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
					.receiveGetSurveyQuestionCatalog( {
						publicationID: connectedPublication.publicationID,
						questions,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );

				await untilCatalogResolved(
					connectedPublication.publicationID
				);

				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should request the catalog only once', async () => {
				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: {
						publicationID: connectedPublication.publicationID,
						questions,
					},
					status: 200,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await untilCatalogResolved(
					connectedPublication.publicationID
				);

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should fetch the new catalog after the saved publication changes', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSurveyQuestionCatalog( {
						publicationID: connectedPublication.publicationID,
						questions,
					} );

				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: {
						publicationID: otherPublication.publicationID,
						questions: otherQuestions,
					},
					status: 200,
				} );

				connectPublication( otherPublication );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				await untilCatalogResolved( otherPublication.publicationID );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( otherQuestions );
			} );

			it( 'should return the first catalog again after saving another publication and then the first one', async () => {
				fetchMock.getOnce( surveyQuestionCatalogEndpoint, {
					body: {
						publicationID: connectedPublication.publicationID,
						questions,
					},
					status: 200,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await untilCatalogResolved(
					connectedPublication.publicationID
				);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSurveyQuestionCatalog( {
						publicationID: otherPublication.publicationID,
						questions: otherQuestions,
					} );

				connectPublication( otherPublication );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( otherQuestions );

				connectPublication();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					surveyQuestionCatalogEndpoint
				);
			} );

			it( 'should return the catalog again after selecting another publication and then the saved one', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSurveyQuestionCatalog( {
						publicationID: connectedPublication.publicationID,
						questions,
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( otherPublication.publicationID );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( connectedPublication.publicationID );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );

				await waitForDefaultTimeouts();

				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
			} );
		} );
	} );
} );
