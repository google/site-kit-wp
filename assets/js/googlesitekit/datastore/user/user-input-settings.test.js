/**
 * `core/user` data store: user input settings tests.
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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	muteFetch,
	provideUserAuthentication,
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import { surveyTriggerEndpoint } from '../../../../../tests/js/mock-survey-endpoints';
import { CORE_USER } from './constants';

describe( 'core/user user-input-settings', () => {
	let registry;
	let store;

	const coreUserInputSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/user-input-settings'
	);
	const coreUserInputSettingsExpectedResponse = {
		purpose: {
			values: [ 'purpose1' ],
			scope: 'site',
		},
		postFrequency: {
			values: [ 'daily' ],
			scope: 'user',
		},
		goals: {
			values: [ 'goal1', 'goal2' ],
			scope: 'user',
		},
	};
	const coreUserInputSettings = {
		purpose: coreUserInputSettingsExpectedResponse.purpose.values,
		postFrequency:
			coreUserInputSettingsExpectedResponse.postFrequency.values,
		goals: coreUserInputSettingsExpectedResponse.goals.values,
	};

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_USER ].store;
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		beforeEach( () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetUserInputSettings(
					coreUserInputSettingsExpectedResponse
				);
		} );

		describe( 'setUserInputSetting', () => {
			it( 'should correctly set new values for the setting', () => {
				const settingID = 'goals';
				const values = [
					'              goal3',
					'             goal4        ',
					'goal5            ',
					'goal6',
				];

				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( settingID, values );
				expect( store.getState() ).toMatchObject( {
					inputSettings: {
						...coreUserInputSettingsExpectedResponse,
						[ settingID ]: {
							...coreUserInputSettingsExpectedResponse[
								settingID
							],
							values: [ 'goal3', 'goal4', 'goal5', 'goal6' ],
						},
					},
				} );
			} );
		} );

		describe( 'saveUserInputSettings', () => {
			it( 'should save settings and add it to the store ', async () => {
				fetchMock.postOnce( coreUserInputSettingsEndpointRegExp, {
					body: coreUserInputSettingsExpectedResponse,
					status: 200,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveUserInputSettings( coreUserInputSettings );
				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					coreUserInputSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: coreUserInputSettings,
							},
						},
					}
				);

				const settings = registry
					.select( CORE_USER )
					.getUserInputSettings();
				expect( settings ).toMatchObject(
					coreUserInputSettingsExpectedResponse
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const args = [ coreUserInputSettings ];
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( coreUserInputSettingsEndpointRegExp, {
					body: response,
					status: 500,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveUserInputSettings( ...args );
				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'saveUserInputSettings', args )
				).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );

			it( 'should trigger survey if there is no error and answers conatin "Other"', async () => {
				provideUserAuthentication( registry );
				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				const settingsResponse = {
					...coreUserInputSettingsExpectedResponse,
					goals: {
						...coreUserInputSettingsExpectedResponse.goals,
						values: [ 'other' ],
					},
				};
				const settings = {
					...coreUserInputSettings,
					goals: [ 'other' ],
				};

				fetchMock.postOnce( coreUserInputSettingsEndpointRegExp, {
					body: settingsResponse,
					status: 200,
				} );
				muteFetch( surveyTriggerEndpoint );

				await registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [ 'other' ] );

				await registry.dispatch( CORE_USER ).saveUserInputSettings();

				expect( fetchMock ).toHaveFetched(
					coreUserInputSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings,
							},
						},
					}
				);

				expect(
					registry.select( CORE_USER ).getUserInputSettings()
				).toEqual( settingsResponse );

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: {
							triggerID: 'userInput_answered_other__goals',
						},
					},
				} );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'should not trigger survey if there is an error, even though answers conatin "Other"', async () => {
				const settings = {
					purpose: [ 'other' ],
					...coreUserInputSettings,
				};

				const args = [ settings ];
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( coreUserInputSettingsEndpointRegExp, {
					body: response,
					status: 500,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveUserInputSettings( ...args );

				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'saveUserInputSettings', args )
				).toMatchObject( response );
				expect( console ).toHaveErrored();

				expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
			} );
		} );

		describe( 'resetUserInputSettings', () => {
			it( 'should correctly reset user input settings', () => {
				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [
						'goal3',
						'goal4',
						'goal5',
						'goal6',
					] );

				registry.dispatch( CORE_USER ).resetUserInputSettings();

				const settings = registry
					.select( CORE_USER )
					.getUserInputSettings();

				expect( settings ).toEqual(
					coreUserInputSettingsExpectedResponse
				);
			} );
		} );

		describe( 'maybeTriggerUserInputSurvey', () => {
			beforeEach( () => {
				provideUserAuthentication( registry );
			} );

			it( 'should bail if no answers contain "Other"', async () => {
				await registry
					.dispatch( CORE_USER )
					.maybeTriggerUserInputSurvey();

				expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
			} );

			it( 'should trigger survey if answers contain "Other"', async () => {
				muteFetch( surveyTriggerEndpoint );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [ 'other' ] );

				await registry
					.dispatch( CORE_USER )
					.maybeTriggerUserInputSurvey();

				expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID: 'userInput_answered_other__goals' },
					},
				} );
			} );

			it.each( [
				[ 'purpose', 'Purpose' ],
				[ 'postFrequency', 'Post Frequency' ],
				[ 'goals', 'Goals' ],
				[ 'purpose_postFrequency', 'Purpose, Post Frequency' ],
				[ 'purpose_goals', 'Purpose, Goals' ],
				[ 'postFrequency_goals', 'Post Frequency, Goals' ],
				[
					'purpose_postFrequency_goals',
					'Purpose, Post Frequency, Goals',
				],
			] )(
				'survey triggerID should be userInput_answered_other__%s when "Other" is answered for the following questions: %s',
				async ( questions ) => {
					const questionsArray = questions.split( '_' );

					muteFetch( surveyTriggerEndpoint );

					registry
						.dispatch( CORE_USER )
						.receiveGetSurveyTimeouts( [] );

					await Promise.all(
						questionsArray.map( async ( question ) => {
							await registry
								.dispatch( CORE_USER )
								.setUserInputSetting( question, [ 'other' ] );
						} )
					);

					registry
						.dispatch( CORE_USER )
						.maybeTriggerUserInputSurvey();

					await subscribeUntil( registry, () =>
						registry
							.select( CORE_USER )
							.hasFinishedResolution( 'getSurveyTimeouts' )
					);

					await subscribeUntil( registry, () =>
						registry
							.select( CORE_USER )
							.hasFinishedResolution( 'getUserInputSettings' )
					);

					expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
						body: {
							data: {
								triggerID: `userInput_answered_other__${ questions }`,
							},
						},
					} );
				}
			);
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getUserInputSettings', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.getOnce( coreUserInputSettingsEndpointRegExp, {
					body: coreUserInputSettingsExpectedResponse,
					status: 200,
				} );

				const { getUserInputSettings } = registry.select( CORE_USER );

				expect( getUserInputSettings() ).toBeUndefined();
				await untilResolved(
					registry,
					CORE_USER
				).getUserInputSettings();

				const settings = getUserInputSettings();
				expect( settings ).toEqual(
					coreUserInputSettingsExpectedResponse
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( getUserInputSettings() ).toEqual( settings );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if data is already in state', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings(
						coreUserInputSettingsExpectedResponse
					);

				const settings = registry
					.select( CORE_USER )
					.getUserInputSettings();
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getUserInputSettings' )
				);

				expect( settings ).toEqual(
					coreUserInputSettingsExpectedResponse
				);
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( coreUserInputSettingsEndpointRegExp, {
					body: response,
					status: 500,
				} );

				registry.select( CORE_USER ).getUserInputSettings();
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getUserInputSettings' )
				);

				const settings = registry
					.select( CORE_USER )
					.getUserInputSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( settings ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getUserInputSetting', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings(
						coreUserInputSettingsExpectedResponse
					);
			} );

			it.each(
				Object.keys( coreUserInputSettings ).reduce(
					( accum, key ) => [ ...accum, [ key ] ],
					[]
				)
			)(
				'should return correct values for the %s setting',
				( settingID ) => {
					const values = registry
						.select( CORE_USER )
						.getUserInputSetting( settingID );
					expect( values ).toBe( coreUserInputSettings[ settingID ] );
				}
			);

			it( 'should return an empty array if the settings does not exist', () => {
				const helpWanted = registry
					.select( CORE_USER )
					.getUserInputSetting( 'helpWanted' );
				expect( Array.isArray( helpWanted ) ).toBe( true );
				expect( helpWanted.length ).toBe( 0 );
			} );
		} );

		describe( 'getUserInputScope', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings(
						coreUserInputSettingsExpectedResponse
					);
			} );

			it.each(
				Object.keys( coreUserInputSettings ).reduce(
					( accum, key ) => [ ...accum, [ key ] ],
					[]
				)
			)(
				'should return correct scope for the %s setting',
				( settingID ) => {
					const values = registry
						.select( CORE_USER )
						.getUserInputSettingScope( settingID );
					expect( values ).toBe(
						coreUserInputSettingsExpectedResponse[ settingID ].scope
					);
				}
			);
		} );

		describe( 'haveUserInputSettingsChanged', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings(
						coreUserInputSettingsExpectedResponse
					);
			} );

			it( 'informs whether client-side settings differ from server-side ones', () => {
				// False after setting to the same values as original, i.e. unchanged settings.
				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [ 'goal1', 'goal2' ] );

				expect(
					registry.select( CORE_USER ).haveUserInputSettingsChanged()
				).toBe( false );
			} );

			it( 'should return false if settings are unchanged', () => {
				expect(
					registry.select( CORE_USER ).haveUserInputSettingsChanged()
				).toBe( false );
			} );

			it( 'compares all keys when keys argument is not supplied', () => {
				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [
						'goal3',
						'goal4',
						'goal5',
						'goal6',
					] );

				expect(
					registry.select( CORE_USER ).haveUserInputSettingsChanged()
				).toBe( true );
			} );

			it.each( [
				[
					'should return true if the changed key is supplied',
					[ 'goals' ],
					true,
				],
				[
					'should return false if an unchanged key is supplied',
					[ 'purpose' ],
					false,
				],
				[
					'should return true if the keys argument array contains a changed key',
					[ 'goals', 'purpose' ],
					true,
				],
				[
					'should return false if an empty keys argument is supplied',
					[],
					false,
				],
			] )(
				'compares select keys when keys argument is supplied - %s',
				( _, keys, expected ) => {
					registry
						.dispatch( CORE_USER )
						.setUserInputSetting( 'goals', [
							'goal3',
							'goal4',
							'goal5',
							'goal6',
						] );

					expect(
						registry
							.select( CORE_USER )
							.haveUserInputSettingsChanged( keys )
					).toBe( expected );
				}
			);
		} );

		describe( 'hasUserInputSettingChanged', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings(
						coreUserInputSettingsExpectedResponse
					);
			} );

			it( 'informs whether client-side specific setting differ from server-side ones', () => {
				// False after setting to the same values as original, i.e. unchanged settings.
				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [ 'goal1', 'goal2' ] );

				expect(
					registry
						.select( CORE_USER )
						.hasUserInputSettingChanged( 'goals' )
				).toBe( false );
			} );

			it( 'should return false if settings are unchanged', () => {
				expect(
					registry
						.select( CORE_USER )
						.hasUserInputSettingChanged( 'goals' )
				).toBe( false );
			} );

			it( 'should return true if a changed key is supplied', () => {
				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [
						'goal3',
						'goal4',
						'goal5',
						'goal6',
					] );

				expect(
					registry
						.select( CORE_USER )
						.hasUserInputSettingChanged( 'goals' )
				).toBe( true );
			} );

			it( 'should return false if an unchanged key is supplied', () => {
				registry
					.dispatch( CORE_USER )
					.setUserInputSetting( 'goals', [
						'goal3',
						'goal4',
						'goal5',
						'goal6',
					] );

				expect(
					registry
						.select( CORE_USER )
						.hasUserInputSettingChanged( 'purpose' )
				).toBe( false );
			} );
		} );
	} );
} );
