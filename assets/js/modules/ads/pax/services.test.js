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
			expect( services ).toEqual(
				expect.objectContaining( {
					businessService: expect.objectContaining( {
						getBusinessInfo: expect.any( Function ),
						fixBusinessInfo: expect.any( Function ),
					} ),
					conversionTrackingService: expect.objectContaining( {
						getSupportedConversionLabels: expect.any( Function ),
					} ),
					termsAndConditionsService: expect.objectContaining( {
						notify: expect.any( Function ),
					} ),
				} )
			);
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

		describe( 'conversionTrackingService', () => {
			describe( 'getSupportedConversionLabels', () => {
				it( 'should hold correct value for conversionLabels property', async () => {
					const supportedConversionLabels =
						await services.conversionTrackingService.getSupportedConversionLabels();

					expect(
						supportedConversionLabels.conversionLabels
					).toEqual( [] );
				} );
			} );
		} );
	} );
} );
