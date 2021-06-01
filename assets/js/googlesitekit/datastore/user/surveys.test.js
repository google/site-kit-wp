/**
 * `core/user` data store: Surveys tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	muteFetch,
} from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/user surveys', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	const survey = {
		survey_payload: 'foo',
		session: 'bar',
	};
	const surveyTriggerEndpoint = /^\/google-site-kit\/v1\/core\/user\/data\/survey-trigger/;
	const surveyEventEndpoint = /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/;

	describe( 'actions', () => {
		describe( 'triggerSurvey', () => {
			it( 'throws an error when parameters are missing or incorrect', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).triggerSurvey();
				} ).toThrow( 'triggerID is required and must be a string' );

				expect( () => {
					registry.dispatch( STORE_NAME ).triggerSurvey( 'coolSurvey', false );
				} ).toThrow( 'options must be an object' );

				expect( () => {
					registry.dispatch( STORE_NAME ).triggerSurvey( 'warmSurvey', { ttl: 'a' } );
				} ).toThrow( 'options.ttl must be a number' );
			} );

			it( 'does not throw an error when parameters are correct', () => {
				muteFetch( surveyTriggerEndpoint, [] );

				expect( () => {
					registry.dispatch( STORE_NAME ).triggerSurvey( 'adSenseSurvey' );
				} ).not.toThrow();

				expect( () => {
					registry.dispatch( STORE_NAME ).triggerSurvey( 'analyticsSurvey', { ttl: 1 } );
				} ).not.toThrow();
			} );

			it( 'makes network requests to endpoints', async () => {
				muteFetch( surveyTriggerEndpoint, [] );

				await registry.dispatch( STORE_NAME ).triggerSurvey( 'optimizeSurvey', { ttl: 1 } );

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID: 'optimizeSurvey' },
					},
				} );
			} );
		} );

		describe( 'sendSurveyEvent', () => {
			it( 'throws an error when parameters are missing or incorrect', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).sendSurveyEvent();
				} ).toThrow( 'eventID is required and must be a string' );

				expect( () => {
					registry.dispatch( STORE_NAME ).sendSurveyEvent( 'dismiss_survey', 'answer_question' );
				} ).toThrow( 'eventData must be an object' );
			} );

			it( 'does not throw an error when parameters are correct', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).sendSurveyEvent( 'dismiss_survey' );
				} ).not.toThrow();

				expect( () => {
					registry.dispatch( STORE_NAME ).sendSurveyEvent( 'answer_question', { foo: 'bar' } );
				} ).not.toThrow();
			} );

			it( 'makes network requests to endpoints', async () => {
				muteFetch( surveyTriggerEndpoint, survey );
				muteFetch( surveyEventEndpoint, {} );

				// Trigger a survey to appear.
				await registry.dispatch( STORE_NAME ).triggerSurvey( 'optimizeSurvey', { ttl: 1 } );
				// Send a survey event.
				await registry.dispatch( STORE_NAME ).sendSurveyEvent( 'answer_question', { foo: 'bar' } );

				expect( fetchMock ).toHaveFetched( surveyEventEndpoint, {
					body: {
						data: {
							event: { answer_question: { foo: 'bar' } },
							session: 'bar',
						},
					},
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getCurrentSurvey', () => {
			it( 'returns null when no current survey is set', async () => {
				expect( registry.select( STORE_NAME ).getCurrentSurvey() ).toEqual( null );
			} );

			it( 'returns the current survey when it is set', async () => {
				muteFetch( surveyTriggerEndpoint, survey );
				await registry.dispatch( STORE_NAME ).triggerSurvey( 'optimizeSurvey', { ttl: 1 } );

				expect(
					registry.select( STORE_NAME ).getCurrentSurvey()
				).toEqual( survey.survey_payload );

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID: 'optimizeSurvey' },
					},
				} );
			} );
		} );

		describe( 'getCurrentSurveySession', () => {
			it( 'returns null when no current survey session is set', async () => {
				expect(
					registry.select( STORE_NAME ).getCurrentSurveySession()
				).toEqual( null );
			} );

			it( 'returns the error once set', async () => {
				muteFetch( surveyTriggerEndpoint, survey );

				await registry.dispatch( STORE_NAME ).triggerSurvey( 'optimizeSurvey', { ttl: 1 } );

				expect(
					registry.select( STORE_NAME ).getCurrentSurveySession()
				).toEqual( survey.session );
				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID: 'optimizeSurvey' },
					},
				} );
			} );
		} );
	} );
} );
