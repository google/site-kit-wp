/**
 * AdSense data requirements tests.
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
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '@/js/modules/adsense/datastore/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '@/js/modules/analytics-4/utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '@/js/util/zero-reports';
import { createTestRegistry } from '@tests/js/test-utils';
import {
	requireAdBlockingRecoverySetupStatus,
	requireAdSenseRevenueInAnalytics,
} from './index';

describe( 'adsense data requirements', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'requireAdBlockingRecoverySetupStatus', () => {
		it( 'should return true when the setup status matches', async () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				adBlockingRecoverySetupStatus:
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED,
			} );

			expect(
				await requireAdBlockingRecoverySetupStatus(
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
				)( registry )
			).toBe( true );
		} );

		it( 'should return false when the setup status does not match', async () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				adBlockingRecoverySetupStatus:
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
			} );

			expect(
				await requireAdBlockingRecoverySetupStatus(
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
				)( registry )
			).toBe( false );
		} );

		it( 'should return false when the setup status is not available', async () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );

			expect(
				await requireAdBlockingRecoverySetupStatus(
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
				)( registry )
			).toBe( false );
		} );
	} );

	describe( 'requireAdSenseRevenueInAnalytics', () => {
		const adSenseAccountID = 'pub-1234567890';
		let reportOptions;

		beforeEach( () => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				accountID: adSenseAccountID,
			} );

			reportOptions = {
				...registry.select( CORE_USER ).getDateRangeDates(),
				dimensions: [ 'pagePath', 'adSourceName' ],
				metrics: [ { name: 'totalAdRevenue' } ],
				dimensionFilters: {
					adSourceName: `Google AdSense account (${ adSenseAccountID })`,
				},
				orderby: [
					{ metric: { metricName: 'totalAdRevenue' }, desc: true },
				],
				limit: 1,
				reportID:
					'notifications_analytics-adsense-linked-overlay_reportArgs',
			};
		} );

		it( 'should return true when there is AdSense revenue in Analytics', async () => {
			provideAnalytics4MockReport( registry, reportOptions );

			expect( await requireAdSenseRevenueInAnalytics()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when the AdSense revenue in Analytics is zero', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport(
					replaceValuesInAnalytics4ReportWithZeroData(
						getAnalytics4MockResponse( reportOptions )
					),
					{ options: reportOptions }
				);

			expect( await requireAdSenseRevenueInAnalytics()( registry ) ).toBe(
				false
			);
		} );

		it( 'should return false when the report is empty', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options: reportOptions } );

			expect( await requireAdSenseRevenueInAnalytics()( registry ) ).toBe(
				false
			);
		} );
	} );
} );
