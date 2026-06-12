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

function renderJSON( element: ReactElement ) {
	return JSON.stringify( TestRenderer.create( element ).toJSON() );
}

const rows = [
	{ name: 'Home', count: '1200' },
	{ name: 'About', count: '300' },
];

describe( 'PDFTable', () => {
	it( 'renders one header cell per column using the column titles', () => {
		const columns: PDFTableColumn[] = [
			{ title: 'Name', key: 'name' },
			{ title: 'Count', key: 'count' },
		];

		const json = renderJSON( <PDFTable columns={ columns } rows={ rows } /> );

		expect( json ).toContain( 'Name' );
		expect( json ).toContain( 'Count' );
	} );

	it( 'renders the format return value in a body cell when only format is set', () => {
		const columns: PDFTableColumn[] = [
			{ title: 'Name', key: 'name' },
			{
				title: 'Count',
				key: 'count',
				format: ( value ) => `#${ value }`,
			},
		];

		const json = renderJSON( <PDFTable columns={ columns } rows={ rows } /> );

		expect( json ).toContain( '#1200' );
		expect( json ).toContain( '#300' );
	} );

	it( 'renders the cell return value in a body cell when cell is set', () => {
		const columns: PDFTableColumn[] = [
			{
				title: 'Name',
				cell: ( row ) => <Text>cell:{ String( row.name ) }</Text>,
			},
			{ title: 'Count', key: 'count' },
		];

		const json = renderJSON( <PDFTable columns={ columns } rows={ rows } /> );

		expect( json ).toContain( 'cell:' );
		expect( json ).toContain( 'Home' );
		expect( json ).toContain( 'About' );
	} );

	it( 'prefers cell over format when a column defines both', () => {
		const columns: PDFTableColumn[] = [
			{
				title: 'Name',
				key: 'name',
				format: () => 'from-format',
				cell: () => <Text>from-cell</Text>,
			},
			{ title: 'Count', key: 'count' },
		];

		const json = renderJSON( <PDFTable columns={ columns } rows={ rows } /> );

		expect( json ).toContain( 'from-cell' );
		expect( json ).not.toContain( 'from-format' );
	} );

	it( 'applies each column width and falls back to an equal share', () => {
		const columns: PDFTableColumn[] = [
			{ title: 'Name', key: 'name', width: '40%' },
			{ title: 'Count', key: 'count' },
		];

		const json = renderJSON( <PDFTable columns={ columns } rows={ rows } /> );

		// The fixed-width column carries its width, the other shares the rest.
		expect( json ).toContain( '40%' );
		expect( json ).toContain( '"flex":1' );
	} );

	it( 'renders the empty-state message when there are no rows', () => {
		const columns: PDFTableColumn[] = [
			{ title: 'Name', key: 'name' },
			{ title: 'Count', key: 'count' },
		];

		const json = renderJSON( <PDFTable columns={ columns } rows={ [] } /> );

		expect( json ).toContain( 'No data available' );
	} );

	it( 'renders a custom empty-state message', () => {
		const columns: PDFTableColumn[] = [ { title: 'Name', key: 'name' } ];

		const json = renderJSON(
			<PDFTable
				columns={ columns }
				rows={ [] }
				emptyMessage="Nothing here"
			/>
		);

		expect( json ).toContain( 'Nothing here' );
	} );
} );
