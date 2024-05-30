/**
 * Services function tests.
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ADS } from '../datastore/constants';
import { createPaxServices } from './services';

describe( 'PAX partner services', () => {
	describe( 'createPaxServices', () => {
		let registry;
		let services;

		beforeEach( () => {
			registry = createTestRegistry();
			services = createPaxServices( registry );
		} );

		it( 'should return object with correct services', () => {
			expect( services ).toEqual( {
				authenticationService: {
					get: expect.any( Function ),
					fix: expect.any( Function ),
				},
				businessService: {
					getBusinessInfo: expect.any( Function ),
					fixBusinessInfo: expect.any( Function ),
				},
				campaignService: {
					notifyNewCampaignCreated: expect.any( Function ),
				},
				conversionTrackingService: {
					getSupportedConversionLabels: expect.any( Function ),
					getPageViewConversionSetting: expect.any( Function ),
					getSupportedConversionTrackingTypes: expect.any( Function ),
				},
				termsAndConditionsService: {
					notify: expect.any( Function ),
				},
				partnerDateRangeService: {
					get: expect.any( Function ),
				},
				userActionService: {
					finishAndCloseSignUpFlow: expect.any( Function ),
				},
			} );
		} );

		describe( 'authenticationService', () => {
			describe( 'get', () => {
				it( 'should contain accessToken property', async () => {
					const authAccess =
						await services.authenticationService.get();

					expect( authAccess ).toHaveProperty( 'accessToken' );
				} );
				it( 'should contain correct accessToken', async () => {
					const _googlesitekitPAXConfig = {
						authAccess: {
							oauthTokenAccess: {
								token: 'test-auth-token',
							},
						},
					};
					services = createPaxServices( registry, {
						_global: { _googlesitekitPAXConfig },
					} );

					const authAccess =
						await services.authenticationService.get();

					/* eslint-disable sitekit/acronym-case */
					expect( authAccess.accessToken ).toEqual(
						'test-auth-token'
					);
					/* eslint-enable sitekit/acronym-case */
				} );
			} );
		} );

		describe( 'businessService', () => {
			describe( 'getBusinessInfo', () => {
				it( 'should contain businessName and businessUrl properties', async () => {
					const businessInfo =
						await services.businessService.getBusinessInfo();

					expect( businessInfo ).toHaveProperty( 'businessName' );
					expect( businessInfo ).toHaveProperty( 'businessUrl' );
				} );

				it( 'should contain correct site info values for businessName and businessUrl properties', async () => {
					provideSiteInfo( registry, {
						siteName: 'Something Test',
						homeURL: 'http://something.test/homepage',
					} );
					const businessInfo =
						await services.businessService.getBusinessInfo();

					/* eslint-disable sitekit/acronym-case */
					expect( businessInfo.businessName ).toEqual(
						'Something Test'
					);
					expect( businessInfo.businessUrl ).toEqual(
						'http://something.test/homepage'
					);
					/* eslint-enable sitekit/acronym-case */
				} );
			} );
		} );

		describe( 'campaignService', () => {
			describe( 'notifyNewCampaignCreated', () => {
				it( 'calls the given function when provided', async () => {
					const onCampaignCreated = jest.fn();
					services = createPaxServices( registry, {
						onCampaignCreated,
					} );
					const { notifyNewCampaignCreated } =
						services.campaignService;
					expect( onCampaignCreated ).not.toHaveBeenCalled();

					const notifyNewCampaignCreatedResponse =
						await notifyNewCampaignCreated( {} );

					expect( notifyNewCampaignCreatedResponse ).toEqual( {} );
					expect( onCampaignCreated ).toHaveBeenCalledTimes( 1 );
				} );
			} );
		} );

		describe( 'conversionTrackingService', () => {
			describe( 'getSupportedConversionLabels', () => {
				it( 'should hold correct default value for conversionLabels property', async () => {
					const supportedConversionLabels =
						await services.conversionTrackingService.getSupportedConversionLabels();

					expect(
						supportedConversionLabels.conversionLabels
					).toEqual( [] );
				} );

				it( 'should hold correct value for conversionLabels property when data is present', async () => {
					const mockSupportedEvents = [ 'mock-event' ];
					registry.dispatch( MODULES_ADS ).receiveModuleData( {
						supportedConversionEvents: mockSupportedEvents,
					} );

					const supportedConversionLabels =
						await services.conversionTrackingService.getSupportedConversionLabels();

					expect(
						supportedConversionLabels.conversionLabels
					).toEqual( mockSupportedEvents );
				} );
			} );

			describe( 'getPageViewConversionSetting', () => {
				it( 'should hold correct value for websitePages property', async () => {
					const wpPagesEndpoint = new RegExp( '^/wp/v2/pages' );

					fetchMock.getOnce( wpPagesEndpoint, {
						body: [
							{
								id: 20,
								title: { rendered: 'Foo Page' },
								link: 'https://www.example.com/foo-page',
							},
							{
								id: 20,
								title: { rendered: 'Bar Child Page' },
								link: 'https://www.example.com/foo/bar-page',
							},
						],
						status: 200,
					} );

					const pageViewConversionSetting =
						await services.conversionTrackingService.getPageViewConversionSetting();

					expect( fetchMock ).toHaveFetched( wpPagesEndpoint, {} );

					expect( fetchMock ).toHaveFetched( wpPagesEndpoint, {} );

					const wpPagesEndpointLastCall =
						fetchMock.lastCall( wpPagesEndpoint );

					expect( wpPagesEndpointLastCall[ 0 ] ).toContain(
						'per_page=100'
					);

					expect(
						pageViewConversionSetting.websitePages
					).toMatchObject( [
						{
							title: 'Foo Page',
							path: '/foo-page',
						},
						{
							title: 'Bar Child Page',
							path: '/foo/bar-page',
						},
					] );
				} );
			} );

			describe( 'getSupportedConversionTrackingTypes', () => {
				it( 'should return the expected supported types', async () => {
					const supportedTypes =
						await services.conversionTrackingService.getSupportedConversionTrackingTypes(
							{}
						);

					expect( supportedTypes ).toMatchObject( {
						conversionTrackingTypes: [ 'TYPE_PAGE_VIEW' ],
					} );
				} );
			} );
		} );

		describe( 'partnerDateRangeService', () => {
			describe( 'get', () => {
				it( 'should contain startDate and endDate properties', async () => {
					const partnerDateRange =
						await services.partnerDateRangeService.get();

					expect( partnerDateRange ).toHaveProperty( 'startDate' );
					expect( partnerDateRange ).toHaveProperty( 'endDate' );
				} );

				it( 'should contain correct Date values', async () => {
					registry
						.dispatch( CORE_USER )
						.setReferenceDate( '2020-09-08' );
					// Set the date range so that it selects the range we should expect:
					// Sept 1 - Sept 7
					registry
						.dispatch( CORE_USER )
						.setDateRange( 'last-7-days' );

					const partnerDateRange =
						await services.partnerDateRangeService.get();

					expect( partnerDateRange.startDate ).toEqual( {
						month: 9,
						day: 1,
						year: 2020,
					} );
					expect( partnerDateRange.endDate ).toEqual( {
						month: 9,
						day: 7,
						year: 2020,
					} );
				} );
			} );
		} );

		describe( 'termsAndConditionsService', () => {
			describe( 'notify', () => {
				it( 'notify callback should return an empty object', async () => {
					const termsAndConditionsServiceNotifyResponse =
						await services.termsAndConditionsService.notify();

					expect( termsAndConditionsServiceNotifyResponse ).toEqual(
						{}
					);
				} );
			} );
		} );

		describe( 'userActionService', () => {
			describe( 'finishAndCloseSignUpFlow', () => {
				it( 'calls the given function when provided', async () => {
					const onFinishAndCloseSignUpFlow = jest.fn();
					services = createPaxServices( registry, {
						onFinishAndCloseSignUpFlow,
					} );
					const { finishAndCloseSignUpFlow } =
						services.userActionService;
					expect( onFinishAndCloseSignUpFlow ).not.toHaveBeenCalled();

					const finishAndCloseSignUpFlowResponse =
						await finishAndCloseSignUpFlow( {} );

					expect( finishAndCloseSignUpFlowResponse ).toEqual( {} );
					expect( onFinishAndCloseSignUpFlow ).toHaveBeenCalledTimes(
						1
					);
				} );
			} );
		} );
	} );
} );
