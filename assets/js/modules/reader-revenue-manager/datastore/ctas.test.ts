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
import { enabledFeatures } from '@/js/features';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from './constants';

describe( 'modules/reader-revenue-manager CTAs', () => {
	let registry: WPDataRegistry;

	const ctasEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
	);
	const ctaEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/cta\\b'
	);
	const createCTAEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-cta'
	);

	const params = {
		organizationID: 'ABCD1234',
		publicationID: 'ABCD_123-4',
	};

	const otherParams = {
		organizationID: 'WXYZ5678',
		publicationID: 'WXYZ_567-8',
	};

	const ctaData = {
		type: 'NEWSLETTER_SIGNUP',
		state: 'ACTIVE',
		config: { title: 'Subscribe to our newsletter' },
	} as const;

	const createArgs = {
		data: ctaData,
	};

	const cta = {
		name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/9d2418415-ab3a',
		type: 'NEWSLETTER_SIGNUP',
		state: 'ACTIVE',
		displayName: 'Weekly newsletter',
	};

	const configuredCTA = {
		type: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
		state: 'ACTIVE',
		displayName: 'Weekly newsletter',
	};

	const surveyConfig = {
		customMessage: 'Help us learn more about you',
		questions: [
			{
				customQuestion: {
					displayText: 'Which section do you read most?',
					answerChoices: [
						{ displayText: 'News' },
						{ displayText: 'Sport' },
					],
				},
			},
			// eslint-disable-next-line sitekit/acronym-case -- An API field name.
			{ presetQuestion: { questionId: 3, answerIds: [ 12, 10 ] } },
		],
	};

	const createSurveyArgs = {
		...params,
		data: {
			type: 'SURVEY',
			state: 'DRAFT',
			config: surveyConfig,
		},
	} as const;

	const surveyCTA = {
		name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/5c3027196-gh6d',
		type: 'SURVEY',
		state: 'DRAFT',
		displayName: 'Survey',
		surveyConfig: {
			customMessage: surveyConfig.customMessage,
			questions: [
				{
					customQuestion: {
						...surveyConfig.questions[ 0 ].customQuestion,
						id: 'custom-question-1',
					},
				},
				surveyConfig.questions[ 1 ],
			],
			// eslint-disable-next-line sitekit/acronym-case -- An API field name.
			reportUrl: 'https://lookerstudio.google.com/reporting/1',
		},
	};

	const otherCTA = {
		name: 'organizations/WXYZ5678/publications/WXYZ_567-8/ctas/8j8152411-cd4b',
		type: 'NEWSLETTER_SIGNUP',
	};

	beforeEach( () => {
		enabledFeatures.add( 'rrmExpressSetup' );
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( params );
	} );

	describe( 'actions', () => {
		describe( 'refreshCTAs', () => {
			it( 'should request the CTAs of the connected publication again', async () => {
				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta ],
					status: 200,
				} );

				const { error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.refreshCTAs();

				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( ctasEndpoint, {
					query: {
						...params,
						_locale: 'user',
					},
				} );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
			} );

			it( 'should send no request when no publication is connected', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( '' );

				expect(
					await registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.refreshCTAs()
				).toEqual( {} );

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
			} );
		} );

		describe( 'createCTA', () => {
			it( 'should create the CTA and return the response', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect( response ).toEqual( cta );
				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
					body: {
						data: { ...params, data: ctaData },
					},
				} );
			} );

			it( 'should add the created CTA to the loaded CTAs', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [], params );

				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
			} );

			it( 'should not add the created CTA to another publication list', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [], params );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [], otherParams );

				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationCTAs(
							otherParams.organizationID,
							otherParams.publicationID
						)
				).toEqual( [] );
			} );

			it( 'should not add the created CTA before the CTAs are loaded', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );
				fetchMock.getOnce( ctasEndpoint, { body: [], status: 200 } );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [] );
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
					.createCTA( createArgs );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForAction( 'createCTA', [
							{ ...params, data: ctaData },
						] )
				).toEqual( errorResponse );
			} );

			it( 'should require the CTA data', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( params )
				).toThrow( 'data is required and must be a non-empty object.' );
			} );

			it( 'should throw for an unsupported CTA type', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { ...ctaData, type: 'SUBSCRIPTION' },
						} )
				).toThrow( 'data.type is not supported.' );
			} );

			it( 'should validate the config via the CTA type handler', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { type: ctaData.type },
						} )
				).toThrow( 'config is required and must be an object.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: {
								...ctaData,
								config: { unknownSetting: 'value' },
							},
						} )
				).toThrow( 'config contains unsupported fields.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { ...ctaData, config: { title: 123 } },
						} )
				).toThrow( 'config.title must be a string.' );
			} );

			it( 'should create a survey CTA when the rrmSurveyCTA feature flag is enabled', async () => {
				enabledFeatures.add( 'rrmSurveyCTA' );

				fetchMock.postOnce( createCTAEndpoint, {
					body: surveyCTA,
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createSurveyArgs );

				expect( response ).toEqual( surveyCTA );
				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
					body: {
						data: createSurveyArgs,
					},
				} );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta, surveyCTA ] );
			} );

			it( 'should reject a survey CTA without a request when the rrmSurveyCTA feature flag is disabled', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( createSurveyArgs )
				).toThrow( 'data.type is not supported.' );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should set an action error when creating a survey CTA fails', async () => {
				enabledFeatures.add( 'rrmSurveyCTA' );

				const errorResponse = {
					code: 'invalid_argument',
					message: 'An active survey needs at least one question.',
					data: { status: 400 },
				};
				fetchMock.postOnce( createCTAEndpoint, {
					body: errorResponse,
					status: 400,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createSurveyArgs );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
			} );

			it( 'should validate the display name', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { ...ctaData, displayName: 123 },
						} )
				).toThrow( 'data.displayName must be a string.' );
			} );

			it( 'should default the CTA state to ACTIVE', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( {
						...createArgs,
						data: {
							type: ctaData.type,
							config: ctaData.config,
						},
					} );

				expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
					body: {
						data: { ...params, data: ctaData },
					},
				} );
			} );

			it( 'should pass through an explicit DRAFT state', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( {
						...createArgs,
						data: { ...ctaData, state: 'DRAFT' },
					} );

				expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
					body: {
						data: {
							...params,
							data: { ...ctaData, state: 'DRAFT' },
						},
					},
				} );
			} );

			it( 'should reject an unsupported CTA state', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { ...ctaData, state: 'ENABLED' },
						} )
				).toThrow( 'data.state is not supported.' );
			} );
		} );
		describe( 'updateCTA', () => {
			const ctaID = '9d2418415-ab3a';

			const updatedCTA = {
				...cta,
				state: 'DRAFT',
				displayName: 'Renamed newsletter',
			};

			const secondCTA = {
				...cta,
				name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/1a2b3c4d5-ef6g',
				displayName: 'Other newsletter',
			};

			const updateArgs = {
				ctaID,
				data: { state: 'DRAFT', displayName: 'Renamed newsletter' },
			} as const;

			it( 'should send the CTA ID and data, and return the response', async () => {
				fetchMock.postOnce( ctaEndpoint, {
					body: updatedCTA,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( updateArgs );

				expect( response ).toEqual( updatedCTA );
				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetchedTimes( 1, ctaEndpoint );
				expect( fetchMock ).toHaveFetched( ctaEndpoint, {
					body: {
						data: { ...params, ...updateArgs },
					},
				} );
			} );

			it( 'should replace the updated CTA in the loaded CTAs without another request', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta, secondCTA ], params );

				fetchMock.postOnce( ctaEndpoint, {
					body: updatedCTA,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( updateArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ updatedCTA, secondCTA ] );

				await waitForDefaultTimeouts();

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
			} );

			it( 'should store the updated CTA by its publication and ID', async () => {
				const { getState } =
					// @ts-expect-error The WPDataRegistry type is missing the stores property.
					registry.stores[ MODULES_READER_REVENUE_MANAGER ].store;

				fetchMock.postOnce( ctaEndpoint, {
					body: updatedCTA,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( updateArgs );

				expect( getState().ctasByID ).toEqual( {
					[ params.publicationID ]: { [ ctaID ]: updatedCTA },
				} );
			} );

			it( 'should not add the updated CTA before the CTAs are loaded', async () => {
				fetchMock.postOnce( ctaEndpoint, {
					body: updatedCTA,
					status: 200,
				} );
				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta ],
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( updateArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
			} );

			it( 'should not replace a CTA in another publication list', async () => {
				const otherPublicationCTA = { ...otherCTA, name: cta.name };

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs(
						[ otherPublicationCTA ],
						otherParams
					);

				fetchMock.postOnce( ctaEndpoint, {
					body: updatedCTA,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( updateArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ updatedCTA ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationCTAs(
							otherParams.organizationID,
							otherParams.publicationID
						)
				).toEqual( [ otherPublicationCTA ] );
			} );

			it( 'should send no request when no publication is connected', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( '' );

				expect(
					await registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.updateCTA( updateArgs )
				).toEqual( {} );

				expect( fetchMock ).not.toHaveFetched( ctaEndpoint );
			} );

			it( 'should set an action error when the request fails', async () => {
				const errorResponse = {
					code: 'not_found',
					message: 'CTA not found',
					data: { status: 404 },
				};
				fetchMock.postOnce( ctaEndpoint, {
					body: errorResponse,
					status: 404,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( updateArgs );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForAction( 'updateCTA', [
							{ ...params, ...updateArgs },
						] )
				).toEqual( errorResponse );
			} );

			it( 'should send a newsletter sign-up config with its type', async () => {
				const data = {
					type: 'NEWSLETTER_SIGNUP',
					config: { title: 'Join our newsletter' },
				} as const;

				fetchMock.postOnce( ctaEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( { ctaID, data } );

				expect( fetchMock ).toHaveFetched( ctaEndpoint, {
					body: { data: { ...params, ctaID, data } },
				} );
			} );

			it( 'should update a survey CTA with its complete configuration when the rrmSurveyCTA feature flag is enabled', async () => {
				enabledFeatures.add( 'rrmSurveyCTA' );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta, surveyCTA ], params );

				const reorderedConfig = {
					customMessage: 'Tell us about yourself',
					questions: [
						surveyConfig.questions[ 1 ],
						surveyConfig.questions[ 0 ],
					],
				};

				const updatedSurveyCTA = {
					...surveyCTA,
					displayName: 'Reader survey',
					state: 'ACTIVE',
					surveyConfig: {
						...reorderedConfig,
						// eslint-disable-next-line sitekit/acronym-case -- An API field name.
						reportUrl: surveyCTA.surveyConfig.reportUrl,
					},
				};

				const data = {
					displayName: 'Reader survey',
					state: 'ACTIVE',
					type: 'SURVEY',
					config: reorderedConfig,
				} as const;

				fetchMock.postOnce( ctaEndpoint, {
					body: updatedSurveyCTA,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updateCTA( { ctaID: '5c3027196-gh6d', data } );

				expect( response ).toEqual( updatedSurveyCTA );
				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( ctaEndpoint, {
					body: {
						data: { ...params, ctaID: '5c3027196-gh6d', data },
					},
				} );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta, updatedSurveyCTA ] );
			} );

			it( 'should reject a survey config without a request when the rrmSurveyCTA feature flag is disabled', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.updateCTA( {
							ctaID,
							data: { type: 'SURVEY', config: surveyConfig },
						} )
				).toThrow( 'data.type is not supported.' );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it.each( [
				[ 'no params', undefined, 'params must be an object.' ],
				[
					'a missing CTA ID',
					{ data: updateArgs.data },
					'ctaID is required and must be a non-empty string.',
				],
				[
					'an empty CTA ID',
					{ ctaID: '', data: updateArgs.data },
					'ctaID is required and must be a non-empty string.',
				],
				[
					'missing data',
					{ ctaID },
					'data is required and must be a non-empty object.',
				],
				[
					'empty data',
					{ ctaID, data: {} },
					'data is required and must be a non-empty object.',
				],
				[
					'data without a supported field',
					{ ctaID, data: { type: 'NEWSLETTER_SIGNUP' } },
					'data must include at least one of displayName, state or config.',
				],
				[
					'an unsupported state',
					{ ctaID, data: { state: 'ENABLED' } },
					'data.state is not supported.',
				],
				[
					'a non-string display name',
					{ ctaID, data: { displayName: 123 } },
					'data.displayName must be a string.',
				],
				[
					'a config without a type',
					{ ctaID, data: { config: { title: 'Subscribe' } } },
					'data.type is not supported.',
				],
				[
					'a config with an unsupported type',
					{
						ctaID,
						data: {
							type: 'SUBSCRIPTION',
							config: { title: 'Subscribe' },
						},
					},
					'data.type is not supported.',
				],
				[
					'a config the type handler rejects',
					{
						ctaID,
						data: {
							type: 'NEWSLETTER_SIGNUP',
							config: { unknownSetting: 'value' },
						},
					},
					'config contains unsupported fields.',
				],
			] )(
				'should throw without a request for %s',
				( _description, args, message ) => {
					expect( () =>
						registry
							.dispatch( MODULES_READER_REVENUE_MANAGER )
							.updateCTA( args )
					).toThrow( message );

					expect( fetchMock ).not.toHaveFetched();
				}
			);
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getPublicationCTAs', () => {
			it( 'should return the CTAs stored under the given publication', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationCTAs(
							params.organizationID,
							params.publicationID
						)
				).toEqual( [ cta ] );
			} );

			it( 'should return `undefined` for a publication that is not loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );

				// Reading an unloaded publication requests its CTAs.
				muteFetch( ctasEndpoint );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationCTAs(
							otherParams.organizationID,
							otherParams.publicationID
						)
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					otherParams.organizationID,
					otherParams.publicationID
				);
			} );

			it( 'should associate a CTAs fetch error with the request identifiers', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( ctasEndpoint, {
					body: response,
					status: 500,
				} );

				registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForSelector( 'getPublicationCTAs', [
							params.organizationID,
							params.publicationID,
						] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getCTAs', () => {
			it( 'should fetch the CTAs when they are not loaded', async () => {
				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta ],
					status: 200,
				} );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect( fetchMock ).toHaveFetched( ctasEndpoint, {
					query: params,
				} );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					'9d2418415-ab3a': configuredCTA,
				} );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.haveSettingsChanged()
				).toBe( false );
			} );

			it( 'should return survey CTAs with their configuration and synchronize them into settings', async () => {
				enabledFeatures.add( 'rrmSurveyCTA' );

				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta, surveyCTA ],
					status: 200,
				} );

				registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta, surveyCTA ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					'9d2418415-ab3a': configuredCTA,
					'5c3027196-gh6d': {
						type: EXPRESS_SETUP_CTAS.SURVEY,
						state: 'DRAFT',
						displayName: 'Survey',
					},
				} );
			} );

			it( 'should not synchronize configured CTAs when the feature is disabled', () => {
				enabledFeatures.delete( 'rrmExpressSetup' );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						...params,
						configuredCTAs: {
							existing: configuredCTA,
						},
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					existing: configuredCTA,
				} );
			} );

			it( 'should skip CTAs with unsupported types when synchronizing configured CTAs', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs(
						[
							cta,
							{
								name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/unknown-type',
								type: 'UNKNOWN_TYPE',
								state: 'ACTIVE',
							},
						],
						params
					);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					'9d2418415-ab3a': configuredCTA,
				} );
			} );

			it( 'should skip CTAs without a supported state when synchronizing configured CTAs', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs(
						[
							cta,
							{
								name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/deleted',
								type: 'NEWSLETTER_SIGNUP',
								state: 'STATE_UNSPECIFIED',
							},
						],
						params
					);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					'9d2418415-ab3a': configuredCTA,
				} );
			} );

			it( 'should store an empty display name for a CTA without one when synchronizing configured CTAs', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs(
						[ { ...cta, displayName: undefined } ],
						params
					);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					'9d2418415-ab3a': { ...configuredCTA, displayName: '' },
				} );
			} );

			it( 'should fetch the CTAs when called with no params', async () => {
				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta ],
					status: 200,
				} );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
			} );

			it( 'should not fetch CTAs when no publication ID is available', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( '' );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();
			} );

			it( 'should not fetch CTAs that are already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
			} );

			it( 'should not fetch CTAs when an empty list is already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [], params );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [] );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					params.organizationID,
					params.publicationID
				);

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
			} );

			it( 'should keep CTA lists for different publications separate', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ otherCTA ], otherParams );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationCTAs(
							otherParams.organizationID,
							otherParams.publicationID
						)
				).toEqual( [ otherCTA ] );
			} );

			it( 'should return `undefined` after selecting a publication whose CTAs are not loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationCTAs( [ cta ], params );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setSettings( otherParams );

				// Selecting a publication whose CTAs are not loaded requests them.
				muteFetch( ctasEndpoint );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTAs(
					otherParams.organizationID,
					otherParams.publicationID
				);
			} );

			it( 'should return the CTAs again when the publication is selected back', async () => {
				const dispatch = registry.dispatch(
					MODULES_READER_REVENUE_MANAGER
				);

				dispatch.receiveGetPublicationCTAs( [ cta ], params );
				dispatch.receiveGetPublicationCTAs( [ otherCTA ], otherParams );

				dispatch.setSettings( otherParams );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ otherCTA ] );

				dispatch.setSettings( params );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );

				await waitForDefaultTimeouts();

				// Both publications' CTAs are already loaded.
				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
			} );
		} );
	} );
} );
