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
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import { renderJSON } from '@/js/components/pdf-export/test-utils';
import { PDFTableColumn } from './PDFTable';
import PDFTableSection from './PDFTableSection';

interface TestRow {
	/** The text of the row's "Name" cell. */
	name: string;
	/** The text of the row's "Count" cell. */
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

	it( 'applies the scaled columnGap prop to the table', () => {
		const json = renderJSON(
			<PDFTableSection
				heading="Top pages"
				columns={ columns }
				rows={ rows }
				columnGap={ 4 }
			/>
		);

		expect( json ).toContain( `"columnGap":${ 4 * PDF_SCALE }` );
	} );

	it( "uses the table's scaled default column gap when no columnGap prop is given", () => {
		const json = renderJSON(
			<PDFTableSection
				heading="Top pages"
				columns={ columns }
				rows={ rows }
			/>
		);

		expect( json ).toContain( `"columnGap":${ 40 * PDF_SCALE }` );
	} );

	it( 'returns null when there are no rows', () => {
		// The section returns null, and no placeholder takes its place.
		const renderer = TestRenderer.create(
			<PDFTableSection
				heading="Top pages"
				columns={ columns }
				rows={ [] }
			/>
		);

		expect( renderer.toJSON() ).toBeNull();
	} );
} );
