/**
 * PDFTableSection tests.
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
 * External dependencies
 */
import { ReactElement } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDFTableColumn } from './PDFTable';
import PDFTableSection from './PDFTableSection';

interface TestRow {
	name: string;
	count: string;
}

const columns: Array< PDFTableColumn< TestRow > > = [
	{ header: 'Name', format: ( row ) => row.name },
	{ header: 'Count', format: ( row ) => row.count },
];

const rows: TestRow[] = [
	{ name: 'Home', count: '1200' },
	{ name: 'About', count: '300' },
];

/**
 * Renders a PDF element to a JSON string for content and style assertions.
 *
 * @since n.e.x.t
 *
 * @param element PDF element to render.
 * @return JSON string of the rendered tree.
 */
function renderJSON( element: ReactElement ) {
	return JSON.stringify( TestRenderer.create( element ).toJSON() );
}

describe( 'PDFTableSection', () => {
	it( 'renders the heading above the table', () => {
		const json = renderJSON(
			<PDFTableSection
				heading="Top pages"
				columns={ columns }
				rows={ rows }
			/>
		);

		expect( json ).toContain( 'Top pages' );
		expect( json ).toContain( 'Name' );
		expect( json ).toContain( 'Home' );
	} );

	it( 'applies the columnGap prop to the table', () => {
		const json = renderJSON(
			<PDFTableSection
				heading="Top pages"
				columns={ columns }
				rows={ rows }
				columnGap={ 4 }
			/>
		);

		expect( json ).toContain( '"columnGap":4' );
	} );

	it( 'uses the table default column gap of 20 when no columnGap prop is given', () => {
		const json = renderJSON(
			<PDFTableSection
				heading="Top pages"
				columns={ columns }
				rows={ rows }
			/>
		);

		expect( json ).toContain( '"columnGap":20' );
	} );

	it( 'renders the empty state instead of the table when there are no rows', () => {
		const json = renderJSON(
			<PDFTableSection
				heading="Top pages"
				columns={ columns }
				rows={ [] }
			/>
		);

		expect( json ).toContain( 'No data available.' );
		expect( json ).not.toContain( 'Name' );
	} );
} );
