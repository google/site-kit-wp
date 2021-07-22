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
import { createCacheKey } from '../../api';
import { setItem, setSelectedStorageBackend } from '../../api/cache';
import { STORE_NAME } from './constants';

describe( 'core/user surveys', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	const survey = {
		survey_payload: 'foo',
		session: {
			session_id: 'bar',
			session_token: '1234',
		},
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

			it( 'does not throw when called with only a triggerID', async () => {
				muteFetch( surveyTriggerEndpoint );

				expect( () => {
					registry.dispatch( STORE_NAME ).triggerSurvey( 'adSenseSurvey' );
				} ).not.toThrow();
			} );

			it( 'does not throw when called with a numeric ttl', () => {
				muteFetch( surveyTriggerEndpoint );

				expect( () => {
					registry.dispatch( STORE_NAME ).triggerSurvey( 'analyticsSurvey', { ttl: 1 } );
				} ).not.toThrow();
			} );

			it( 'makes network requests to endpoints', async () => {
				muteFetch( surveyTriggerEndpoint );

				await registry.dispatch( STORE_NAME ).triggerSurvey( 'optimizeSurvey' );

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID: 'optimizeSurvey' },
					},
				} );
			} );

			it( 'does not fetch if there is a cache value present for the trigger ID', async () => {
				await setItem(
					createCacheKey( 'core', 'user', 'survey-trigger', { triggerID: 'optimizeSurvey' } ),
					{} // Any value will due for now.
				);

				await registry.dispatch( STORE_NAME ).triggerSurvey( 'optimizeSurvey' );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should cache survey for provided ttl', async () => {
				const triggerID = 'optimizeSurvey';
				const mockedSetItem = jest.fn();

				setSelectedStorageBackend( {
					getItem: () => undefined,
					setItem: mockedSetItem,
					removeItem: () => undefined,
				} );

				fetchMock.postOnce( surveyTriggerEndpoint, { body: { triggerID } } );
				await registry.dispatch( STORE_NAME ).triggerSurvey( triggerID, { ttl: 500 } );
				jest.advanceTimersByTime( 35000 );

				// Wait one tick for async storage functions.
				await new Promise( ( resolve ) => resolve() );

				const { ttl } = JSON.parse( mockedSetItem.mock.calls[ 0 ][ 1 ] );
				expect( ttl ).toEqual( 500 );

				// Reset the backend storage mechanism.
				setSelectedStorageBackend( undefined );
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
				muteFetch( surveyEventEndpoint );

				// Survey events are only sent if there is a current survey.
				registry.dispatch( STORE_NAME ).receiveTriggerSurvey( survey, { triggerID: 'optimizeSurvey' } );
				// Send a survey event.
				await registry.dispatch( STORE_NAME ).sendSurveyEvent( 'answer_question', { foo: 'bar' } );

				expect( fetchMock ).toHaveFetched( surveyEventEndpoint, {
					body: {
						data: {
							event: { answer_question: { foo: 'bar' } },
							session: survey.session,
						},
					},
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getCurrentSurvey', () => {
			it( 'returns null when no current survey is set', async () => {
				expect( registry.select( STORE_NAME ).getCurrentSurvey() ).toBeNull();
			} );

			it( 'returns the current survey when it is set', () => {
				registry.dispatch( STORE_NAME ).receiveTriggerSurvey( survey, { triggerID: 'optimizeSurvey' } );

				expect(
					registry.select( STORE_NAME ).getCurrentSurvey()
				).toEqual( survey.survey_payload );
			} );
		} );

		describe( 'getCurrentSurveySession', () => {
			it( 'returns null when no current survey session is set', async () => {
				expect(
					registry.select( STORE_NAME ).getCurrentSurveySession()
				).toBeNull();
			} );

			it( 'returns the current survey session when set', () => {
				registry.dispatch( STORE_NAME ).receiveTriggerSurvey( survey, { triggerID: 'optimizeSurvey' } );

				expect(
					registry.select( STORE_NAME ).getCurrentSurveySession()
				).toEqual( survey.session );
			} );
		} );
	} );
} );
