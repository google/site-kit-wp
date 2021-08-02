/**
 * Error utility function tests.
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
import { isRestrictedMetricsError } from './error';

describe( 'Analytics error utilities', () => {
	describe( 'isRestrictedMetricsError', () => {
		// Valid restricted error properties.
		const code = 400;
		const message =
			'Restricted metric(s): ga:adsenseRevenue, ga:adsensePageImpressions, ga:adsenseECPM can only be queried under certain conditions. For details see https://developers.google.com/analytics/devguides/reporting/core/dimsmets.';

		it( 'returns `false` for non-error objects', () => {
			expect( isRestrictedMetricsError() ).toBe( false );
			expect( isRestrictedMetricsError( null ) ).toBe( false );
			expect( isRestrictedMetricsError( true ) ).toBe( false );
			expect( isRestrictedMetricsError( [] ) ).toBe( false );
			expect( isRestrictedMetricsError( 123 ) ).toBe( false );
			expect( isRestrictedMetricsError( new Date() ) ).toBe( false );
		} );

		it( 'requires the error to have a 400 code', () => {
			expect( isRestrictedMetricsError( { code: 500, message } ) ).toBe(
				false
			);
			expect( isRestrictedMetricsError( { code: 400, message } ) ).toBe(
				true
			);
		} );

		it( 'requires the error to have a "Restricted metric(s)" message', () => {
			expect(
				isRestrictedMetricsError( {
					code,
					message: 'Internal server error',
				} )
			).toBe( false );
			expect(
				isRestrictedMetricsError( {
					code,
					message: 'Restricted metric(s): ga:somemetric',
				} )
			).toBe( true );
		} );

		describe( 'optional `matchMetric` parameter', () => {
			it( 'returns `true` if the error message contains a metric that matches the given matcher', () => {
				expect(
					isRestrictedMetricsError( { code, message }, 'ga:other' )
				).toBe( false );
				expect(
					isRestrictedMetricsError( { code, message }, 'ga:adsense' )
				).toBe( true );
			} );

			it( 'only matches against found metrics', () => {
				expect(
					isRestrictedMetricsError( {
						code,
						message: `${ message } foobar`,
					} )
				).toBe( true );
				// Returns false because no metric matches 'foobar'.
				expect(
					isRestrictedMetricsError(
						{ code, message: `${ message } foobar` },
						'foobar'
					)
				).toBe( false );
			} );
		} );
	} );
} );
