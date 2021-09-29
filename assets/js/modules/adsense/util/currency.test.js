/**
 * Tests for Adsense Currency Utilities.
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

import { getCurrencyFormat } from './currency';

describe( 'getCurrencyFormat', () => {
	const getMockAdsenseReportWithCurrency = ( currencyCode ) => ( {
		headers: [
			{
				currencyCode,
			},
		],
	} );

	it.each( [ 'EUR', 'USD', 'JPY', 'GBP' ] )(
		'Returns the correct currency code (%s) when given an Adsense report',
		( currency ) => {
			const mockReport = getMockAdsenseReportWithCurrency( currency );
			const currencyFormat = getCurrencyFormat( mockReport );

			expect( currencyFormat ).toMatchObject( {
				style: 'currency',
				currency,
			} );
		}
	);

	it( 'Returns decimal formatting options if the report is undefined', () => {
		const fallbackCurrencyFormat = getCurrencyFormat( undefined );

		expect( fallbackCurrencyFormat ).toMatchObject( {
			style: 'decimal',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		} );
	} );
} );
