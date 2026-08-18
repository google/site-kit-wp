/**
 * Analytics 4 page report URL helper tests.
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
import { getAllPagesReportURL, getPageReportURL } from './page-report-url';

describe( 'getAllPagesReportURL', () => {
	const DATES = { startDate: '2025-01-01', endDate: '2025-01-28' };

	it( 'reads the all-pages report URL filtered to the page path', () => {
		const getServiceReportURL = jest.fn(
			() => 'https://analytics.example.com/report'
		);

		const url = getAllPagesReportURL(
			{ getServiceReportURL },
			'/pricing',
			DATES
		);

		expect( url ).toBe( 'https://analytics.example.com/report' );
		expect( getServiceReportURL ).toHaveBeenCalledWith(
			'all-pages-and-screens',
			{
				filters: { unifiedPagePathScreen: '/pricing' },
				dates: DATES,
			}
		);
	} );

	it( 'returns undefined when the property has not loaded', () => {
		const url = getAllPagesReportURL(
			{ getServiceReportURL: () => undefined },
			'/pricing',
			DATES
		);

		expect( url ).toBeUndefined();
	} );
} );

describe( 'getPageReportURL', () => {
	const DATES = { startDate: '2025-01-01', endDate: '2025-01-28' };

	it( 'reads the all-pages report URL filtered to the page path', () => {
		const getServiceReportURL = jest.fn(
			() => 'https://analytics.example.com/report'
		);

		const url = getPageReportURL( {
			analytics: { getServiceReportURL },
			pagePath: '/pricing',
			dates: DATES,
			viewOnly: false,
		} );

		expect( url ).toBe( 'https://analytics.example.com/report' );
		expect( getServiceReportURL ).toHaveBeenCalledWith(
			'all-pages-and-screens',
			{
				filters: { unifiedPagePathScreen: '/pricing' },
				dates: DATES,
			}
		);
	} );

	it( 'returns undefined without reading the URL on a view-only export', () => {
		const getServiceReportURL = jest.fn(
			() => 'https://analytics.example.com/report'
		);

		const url = getPageReportURL( {
			analytics: { getServiceReportURL },
			pagePath: '/pricing',
			dates: DATES,
			viewOnly: true,
		} );

		expect( url ).toBeUndefined();
		expect( getServiceReportURL ).not.toHaveBeenCalled();
	} );
} );
