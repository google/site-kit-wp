/**
 * PDFTable tests.
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
import { Text } from '@react-pdf/renderer';
import { ReactElement } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import PDFTable, { PDFTableColumn } from './PDFTable';

interface TestRow {
	name: string;
	count: string;
}

/**
 * Renders a PDF element to a JSON string for content and style assertions.
 *
 * @since 1.182.0
 *
 * @param element PDF element to render.
 * @return JSON string of the rendered tree.
 */
function renderJSON( element: ReactElement ) {
	return JSON.stringify( TestRenderer.create( element ).toJSON() );
}

/**
 * Shared fixture rows used by the table tests.
 */
const rows: TestRow[] = [
	{ name: 'Home', count: '1200' },
	{ name: 'About', count: '300' },
];

describe( 'PDFTable', () => {
	it( 'renders one header cell per column using the column headers', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => row.name },
			{ header: 'Count', format: ( row ) => row.count },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( 'Name' );
		expect( json ).toContain( 'Count' );
	} );

	it( "renders the text that a column's format function returns", () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => row.name },
			{ header: 'Count', format: ( row ) => `#${ row.count }` },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( '#1200' );
		expect( json ).toContain( '#300' );
	} );

	it( "renders the content that a column's cell function returns", () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{
				header: 'Name',
				cell: ( row ) => <Text>cell:{ row.name }</Text>,
			},
			{ header: 'Count', format: ( row ) => row.count },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( 'cell:' );
		expect( json ).toContain( 'Home' );
		expect( json ).toContain( 'About' );
	} );

	it( 'uses the cell content instead of the format text when a column sets both', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{
				header: 'Name',
				format: () => 'from-format',
				cell: () => <Text>from-cell</Text>,
			},
			{ header: 'Count', format: ( row ) => row.count },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( 'from-cell' );
		expect( json ).not.toContain( 'from-format' );
	} );

	it( 'applies each column width and falls back to an equal share of the row', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', width: '40%', format: ( row ) => row.name },
			{ header: 'Count', format: ( row ) => row.count },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		// The fixed-width column keeps its width, the other shares the rest.
		expect( json ).toContain( '40%' );
		expect( json ).toContain( '"flex":1' );
	} );

	it( 'applies the default column gap of 20 between the cells', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => row.name },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( '"columnGap":20' );
	} );

	it( 'uses the columnGap prop instead of the default when it is set', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => row.name },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } columnGap={ 4 } />
		);

		expect( json ).toContain( '"columnGap":4' );
		expect( json ).not.toContain( '"columnGap":20' );
	} );

	it( 'right-aligns the header and cell text when a column sets align to right', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => row.name },
			{ header: 'Count', align: 'right', format: ( row ) => row.count },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( '"textAlign":"right"' );
	} );

	it( 'renders one body row per data row', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => `name:${ row.name }` },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( 'name:Home' );
		expect( json ).toContain( 'name:About' );
	} );

	it( 'adds horizontal padding to the row content', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => row.name },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( '"paddingHorizontal":12' );
	} );

	it( 'removes the bottom border from the last body row', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => row.name },
		];

		const json = renderJSON(
			<PDFTable columns={ columns } rows={ rows } />
		);

		expect( json ).toContain( '"borderBottomWidth":0' );
	} );

	it( 'renders only the header row when there are no rows', () => {
		const columns: Array< PDFTableColumn< TestRow > > = [
			{ header: 'Name', format: ( row ) => `name:${ row.name }` },
		];

		const json = renderJSON( <PDFTable columns={ columns } rows={ [] } /> );

		expect( json ).toContain( 'Name' );
		expect( json ).not.toContain( 'name:' );
	} );
} );
