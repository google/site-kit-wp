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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { createPaxServices } from './services';

describe( 'modules/ads/pax services', () => {
	describe( 'createPaxServices', () => {
		let registry;
		let services;

		beforeEach( async () => {
			registry = createTestRegistry();

			await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
				siteName: 'Something Test',
				homeURL: 'http://something.test/homepage',
			} );

			services = createPaxServices( registry );
		} );

		it( 'should return object with businessService and conversionTrackingService properties', () => {
			expect( services ).toEqual(
				expect.objectContaining( {
					businessService: expect.objectContaining( {
						getBusinessInfo: expect.any( Function ),
						fixBusinessInfo: expect.any( Function ),
					} ),
					conversionTrackingService: expect.objectContaining( {
						getSupportedConversionLabels: expect.any( Function ),
						termsAndConditionsService: expect.any( Function ),
					} ),
				} )
			);
		} );

		it( 'businessService property should contain businessName and businessUrl', async () => {
			const businessInfo =
				await services.businessService.getBusinessInfo();

			/* eslint-disable sitekit/acronym-case */
			expect( businessInfo ).toEqual(
				expect.objectContaining( {
					businessName: expect.any( String ),
					businessUrl: expect.any( String ),
				} )
			);
			/* eslint-enable sitekit/acronym-case */
		} );

		it( 'businessName and businessUrl should hold correct site info values', async () => {
			const businessInfo =
				await services.businessService.getBusinessInfo();

			/* eslint-disable sitekit/acronym-case */
			expect( businessInfo.businessName ).toEqual( 'Something Test' );
			expect( businessInfo.businessUrl ).toEqual(
				'http://something.test/homepage'
			);
			/* eslint-enable sitekit/acronym-case */
		} );

		it( 'getSupportedConversionLabels should hold correct value', async () => {
			const supportedConversionLabels =
				await services.conversionTrackingService.getSupportedConversionLabels();

			expect( supportedConversionLabels.conversionLabels ).toEqual( [] );
		} );
	} );
} );
