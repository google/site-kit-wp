/**
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
import { buildTopAuthorsReportOptions } from './topAuthors';

describe( 'buildTopAuthorsReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should return undefined without a primary event', () => {
		expect(
			buildTopAuthorsReportOptions( {
				dates,
				primaryEvent: undefined,
				limit: 6,
			} )
		).toBeUndefined();
	} );

	it( 'should filter to rows with the author dimension set', () => {
		const options = buildTopAuthorsReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect(
			options?.dimensionFilters?.[
				'customEvent:googlesitekit_post_author'
			]
		).toMatchObject( {
			filterType: 'emptyFilter',
			notExpression: true,
		} );
	} );

	it( 'should append the given context to the reportID, and omit it otherwise', () => {
		const withoutContext = buildTopAuthorsReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );
		const withContext = buildTopAuthorsReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
			context: 'ecommerce',
		} );

		expect( withContext?.reportID ).toBe(
			`${ withoutContext?.reportID }_ecommerce`
		);
	} );
} );
