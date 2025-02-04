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
import { CORE_USER, GLOBAL_SURVEYS_TIMEOUT_SLUG } from './constants';
import {
	createTestRegistry,
	untilResolved,
	muteFetch,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import {
	surveyEventEndpoint,
	surveyTimeoutEndpoint,
	surveyTimeoutsEndpoint,
	surveyTriggerEndpoint,
} from '../../../../../tests/js/mock-survey-endpoints';

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

	describe( 'actions', () => {
		describe( 'triggerSurvey', () => {
			it( 'should throw an error when parameters are missing or incorrect', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).triggerSurvey();
				} ).toThrow( 'triggerID is required and must be a string' );

				expect( () => {
					registry
						.dispatch( CORE_USER )
						.triggerSurvey( 'coolSurvey', false );
				} ).toThrow( 'options must be an object' );

				expect( () => {
					registry
						.dispatch( CORE_USER )
						.triggerSurvey( 'warmSurvey', { ttl: 'a' } );
				} ).toThrow( 'options.ttl must be a number' );
			} );

			it( 'should not throw when called with only a triggerID', async () => {
				provideUserAuthentication( registry );

				muteFetch( surveyTriggerEndpoint );
				muteFetch( surveyTimeoutEndpoint );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				expect( () => {
					registry
						.dispatch( CORE_USER )
						.triggerSurvey( 'adSenseSurvey' );
				} ).not.toThrow();

				await untilResolved( registry, CORE_USER ).getSurveyTimeouts();
			} );

			it( 'should not fetch if user is not authenticated', async () => {
				provideUserAuthentication( registry, { authenticated: false } );

				await registry
					.dispatch( CORE_USER )
					.triggerSurvey( 'userInput_answered_other__goals' );

				expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID: 'userInput_answered_other__goals' },
					},
				} );
			} );

			it( 'should wait for authentication to be resolved before making a network request', async () => {
				muteFetch( surveyTriggerEndpoint );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/authentication'
					),
					{
						authenticated: true,
					}
				);

				const triggerSurveyPromise = registry
					.dispatch( CORE_USER )
					.triggerSurvey( 'userInput_answered_other__goals', {
						ttl: 123,
					} );

				expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );

				await triggerSurveyPromise;

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: {
							triggerID: 'userInput_answered_other__goals',
							ttl: 123,
						},
					},
				} );
			} );

			it( 'should make network requests to survey endpoint', async () => {
				provideUserAuthentication( registry );

				muteFetch( surveyTriggerEndpoint );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				await registry
					.dispatch( CORE_USER )
					.triggerSurvey( 'userInput_answered_other__goals', {
						ttl: 123,
					} );

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: {
							triggerID: 'userInput_answered_other__goals',
							ttl: 123,
						},
					},
				} );
			} );

			it( 'should not fetch if the survey is timed out', async () => {
				const triggerID = 'userInput_answered_other__goals';

				provideUserAuthentication( registry );

				registry
					.dispatch( CORE_USER )
					.receiveGetSurveyTimeouts( [ triggerID ] );

				await registry.dispatch( CORE_USER ).triggerSurvey( triggerID );

				expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID },
					},
				} );
			} );

			it( 'should only fetch once per triggerID', async () => {
				const { triggerSurvey } = registry.dispatch( CORE_USER );
				fetchMock.post( surveyTriggerEndpoint, {} );

				provideUserAuthentication( registry );
				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				await Promise.all( [
					triggerSurvey( 'testID', { ttl: 500 } ),
					triggerSurvey( 'testID', { ttl: 500 } ),
				] );

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					surveyTriggerEndpoint
				);
			} );

			it( 'should cache survey for provided ttl', async () => {
				const triggerID = 'userInput_answered_other__goals';

				provideUserAuthentication( registry );

				await registry.resolveSelect( CORE_USER ).getAuthentication();

				muteFetch( surveyTriggerEndpoint );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				await registry.resolveSelect( CORE_USER ).getSurveyTimeouts();

				jest.useFakeTimers();

				await registry
					.dispatch( CORE_USER )
					.triggerSurvey( triggerID, { ttl: 500 } );

				jest.advanceTimersByTime( 45000 );

				// Wait one tick for async storage functions.
				await new Promise( ( resolve ) => resolve() );

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: {
							triggerID: 'userInput_answered_other__goals',
							ttl: 500,
						},
					},
				} );
			} );
		} );

		describe( 'sendSurveyEvent', () => {
			it( 'throws an error when parameters are missing or incorrect', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).sendSurveyEvent();
				} ).toThrow( 'eventID is required and must be a string' );

				expect( () => {
					registry
						.dispatch( CORE_USER )
						.sendSurveyEvent( 'dismiss_survey', 'answer_question' );
				} ).toThrow( 'eventData must be an object' );
			} );

			it( 'does not throw an error when parameters are correct', () => {
				expect( () => {
					registry
						.dispatch( CORE_USER )
						.sendSurveyEvent( 'dismiss_survey' );
				} ).not.toThrow();

				expect( () => {
					registry
						.dispatch( CORE_USER )
						.sendSurveyEvent( 'answer_question', { foo: 'bar' } );
				} ).not.toThrow();
			} );

			it( 'makes network requests to endpoints', async () => {
				muteFetch( surveyEventEndpoint );

				// Survey events are only sent if there is a current survey.
				registry.dispatch( CORE_USER ).receiveGetSurvey( { survey } );

				// Send a survey event.
				await registry
					.dispatch( CORE_USER )
					.sendSurveyEvent( 'answer_question', { foo: 'bar' } );

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
			it( 'returns undefined when no current survey is set', () => {
				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getCurrentSurvey', [] );

				expect(
					registry.select( CORE_USER ).getCurrentSurvey()
				).toBeUndefined();
			} );

			it( 'returns the current survey when it is set', () => {
				registry.dispatch( CORE_USER ).receiveGetSurvey( { survey } );

				expect(
					registry.select( CORE_USER ).getCurrentSurvey()
				).toEqual( survey.survey_payload );
			} );
		} );

		describe( 'getCurrentSurveySession', () => {
			it( 'returns undefined when no current survey session is set', () => {
				expect(
					registry.select( CORE_USER ).getCurrentSurveySession()
				).toBeUndefined();
			} );

			it( 'returns the current survey session when set', () => {
				registry.dispatch( CORE_USER ).receiveGetSurvey( { survey } );

				expect(
					registry.select( CORE_USER ).getCurrentSurveySession()
				).toEqual( survey.session );
			} );
		} );

		describe( 'getSurveyTimeouts', () => {
			it( 'should return undefined util resolved', async () => {
				muteFetch( surveyTimeoutsEndpoint, [] );
				expect(
					registry.select( CORE_USER ).getSurveyTimeouts()
				).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getSurveyTimeouts();
			} );

			it( 'should return survey timeouts received from API', async () => {
				fetchMock.getOnce( surveyTimeoutsEndpoint, {
					body: [ 'foo', 'bar' ],
				} );

				const timeouts = registry
					.select( CORE_USER )
					.getSurveyTimeouts();
				expect( timeouts ).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getSurveyTimeouts();

				expect(
					registry.select( CORE_USER ).getSurveyTimeouts()
				).toEqual( [ 'foo', 'bar' ] );
				expect( fetchMock ).toHaveFetched();
			} );

			it( 'should throw an error', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( surveyTimeoutsEndpoint, {
					body: response,
					status: 500,
				} );

				const timeouts = registry
					.select( CORE_USER )
					.getSurveyTimeouts();
				expect( timeouts ).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getSurveyTimeouts();

				registry.select( CORE_USER ).getSurveyTimeouts();

				const error = registry
					.select( CORE_USER )
					.getErrorForSelector( 'getSurveyTimeouts' );
				expect( error ).toMatchObject( response );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isSurveyTimedOut', () => {
			it( 'should return undefined if getSurveyTimeouts selector is not resolved yet', async () => {
				fetchMock.getOnce( surveyTimeoutsEndpoint, { body: [] } );
				expect(
					registry.select( CORE_USER ).isSurveyTimedOut( 'foo' )
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getSurveyTimeouts();
			} );

			it( 'should return TRUE if the survey is timed out', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetSurveyTimeouts( [ 'foo', 'bar' ] );
				expect(
					registry.select( CORE_USER ).isSurveyTimedOut( 'foo' )
				).toBe( true );
			} );

			it( 'should return FALSE if the survey is not timed out', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetSurveyTimeouts( [ 'foo', 'bar' ] );
				expect(
					registry.select( CORE_USER ).isSurveyTimedOut( 'baz' )
				).toBe( false );
			} );
		} );

		describe( 'areSurveysOnCooldown', () => {
			it( 'should return undefined if getSurveyTimeouts selector is not resolved yet', async () => {
				fetchMock.getOnce( surveyTimeoutsEndpoint, { body: [] } );

				expect(
					registry.select( CORE_USER ).areSurveysOnCooldown()
				).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getSurveyTimeouts();
			} );

			it( 'should return TRUE if surveys are on cooldown', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetSurveyTimeouts( [
						'foo',
						GLOBAL_SURVEYS_TIMEOUT_SLUG,
					] );
				expect(
					registry.select( CORE_USER ).areSurveysOnCooldown()
				).toBe( true );
			} );

			it( 'should return FALSE if surveys are not on cooldown', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetSurveyTimeouts( [ 'foo', 'bar' ] );
				expect(
					registry.select( CORE_USER ).areSurveysOnCooldown()
				).toBe( false );
			} );
		} );
	} );
} );
