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
			.finishResolution( 'getSettings', [] );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		connectPublication();
	} );

	describe( 'actions', () => {
		describe( 'resetSurveyQuestionCatalog', () => {
			it( 'should invalidate the resolution while keeping the stored catalog', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSurveyQuestionCatalog( {
						publicationID: connectedPublication.publicationID,
						questions,
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.finishResolution( 'getSurveyQuestionCatalog', [] );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.resetSurveyQuestionCatalog();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.hasFinishedResolution( 'getSurveyQuestionCatalog', [] )
				).toBe( false );

				// The catalog is stored under the publication it was fetched
				// for, so it cannot be mistaken for another publication's.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toEqual( questions );
			} );

			it( 'should clear the stored error of the selector', async () => {
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

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getSurveyQuestionCatalog();

				expect( console ).toHaveErrored();
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForSelector( 'getSurveyQuestionCatalog', [] )
				).toMatchObject( error );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.resetSurveyQuestionCatalog();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForSelector( 'getSurveyQuestionCatalog', [] )
				).toBeUndefined();
			} );
		} );
	} );

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

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getSurveyQuestionCatalog();

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

			it( 'should store a response under the publication it names', () => {
				// A different publication is connected by the time the
				// response lands.
				connectPublication( {
					organizationID: 'WXYZ5678',
					publicationID: 'WXYZ_567-8',
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSurveyQuestionCatalog( {
						publicationID: connectedPublication.publicationID,
						questions,
					} );

				const select = registry.select(
					MODULES_READER_REVENUE_MANAGER
				);

				// The newly connected publication has no catalog of its own.
				expect( select.getSurveyQuestionCatalog() ).toBeUndefined();

				// Connecting the publication the response named shows its
				// catalog.
				connectPublication();

				expect( select.getSurveyQuestionCatalog() ).toEqual(
					questions
				);
			} );

			it( 'should not fetch the catalog before the settings have loaded', async () => {
				registry = createTestRegistry();
				freezeFetch( settingsEndpoint );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await waitForDefaultTimeouts();

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

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getSurveyQuestionCatalog();

				expect( fetchMock ).not.toHaveFetched(
					surveyQuestionCatalogEndpoint
				);
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSurveyQuestionCatalog()
				).toBeUndefined();
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

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getSurveyQuestionCatalog();

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

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getSurveyQuestionCatalog();

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSurveyQuestionCatalog();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					surveyQuestionCatalogEndpoint
				);
			} );
		} );
	} );
} );
