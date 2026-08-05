/**
 * PDFMetricTileTable tests.
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
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import PDFMetricTileTable from './PDFMetricTileTable';

/**
 * Collects every text string rendered in a react-test-renderer tree, so a test
 * can assert on the tile copy without walking the tree itself.
 *
 * @since n.e.x.t
 *
 * @param {(string|number|Object|null)} node   The current tree node.
 * @param {string[]}                    output The strings collected so far.
 * @return {string[]} The collected text strings.
 */
function findTextStrings(
	node:
		| string
		| number
		| TestRenderer.ReactTestRendererJSON
		| null
		| undefined,
	output: string[] = []
): string[] {
	if ( node === null || node === undefined ) {
		return output;
	}
	if ( typeof node === 'string' ) {
		output.push( node );
		return output;
	}
	if ( typeof node === 'number' ) {
		output.push( String( node ) );
		return output;
	}
	if ( Array.isArray( node.children ) ) {
		node.children.forEach( ( child ) => findTextStrings( child, output ) );
	}
	return output;
}

/**
 * Renders `PDFMetricTileTable` with the given props and returns its collected
 * text strings.
 *
 * @since n.e.x.t
 *
 * @param {Object} props The tile props.
 * @return {string[]} The rendered text strings.
 */
function renderTable(
	props: React.ComponentProps< typeof PDFMetricTileTable >
): string[] {
	const renderer = TestRenderer.create( <PDFMetricTileTable { ...props } /> );
	const tree = renderer.toJSON();
	if ( Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return findTextStrings( tree );
}

const ROWS = [
	{ primary: 'New York', metric: '40%' },
	{ primary: 'London', metric: '30%' },
	{ primary: 'Tokyo', metric: '20%' },
	{ primary: 'Paris', metric: '10%' },
];

describe( 'PDFMetricTileTable', () => {
	it( 'renders the title and every ranked row with its metric', () => {
		const text = renderTable( {
			title: 'Top cities',
			rows: ROWS,
		} ).join( ' ' );

		expect( text ).toContain( 'Top cities' );
		ROWS.forEach( ( { primary, metric } ) => {
			expect( text ).toContain( primary );
			expect( text ).toContain( metric );
		} );
	} );

	it( 'caps the rendered rows at the limit', () => {
		const text = renderTable( {
			title: 'Top cities',
			rows: ROWS,
			limit: 2,
		} ).join( ' ' );

		expect( text ).toContain( 'New York' );
		expect( text ).toContain( 'London' );
		// Rows beyond the limit are not rendered.
		expect( text ).not.toContain( 'Tokyo' );
		expect( text ).not.toContain( 'Paris' );
	} );

	it( 'matches the dashboard tile typography and truncates a long label', () => {
		const tree = TestRenderer.create(
			<PDFMetricTileTable
				title="Top pages"
				rows={ [ { primary: 'A very long page title', metric: '37' } ] }
			/>
		).toJSON();
		const json = JSON.stringify( tree );

		// Lengths are scaled to PDF points, so compare against the scaled value:
		// 12px text with 0.2px letter spacing, as on the dashboard.
		expect( json ).toContain( `"fontSize":${ scalePDFValue( 12 ) }` );
		expect( json ).toContain( `"letterSpacing":${ scalePDFValue( 0.2 ) }` );
		// Line height is a multiplier, so it is not scaled: 12 × 1.33 ≈ 16px.
		expect( json ).toContain( '"lineHeight":1.33' );
		// The label truncates on one line rather than wrapping, which needs a
		// bounded cell around it.
		expect( json ).toContain( '"textOverflow":"ellipsis"' );
		expect( json ).toContain( '"maxLines":1' );
		expect( json ).toContain( '"flexGrow":1,"flexShrink":1' );
		// The row carries no padding of its own; the line height spaces the
		// entries, as the design intends.
		expect( json ).toContain(
			'"style":{"flexDirection":"row","justifyContent":"space-between"}'
		);
	} );

	it( 'keeps a 20px gap between the label and the metric and sizes the label to the width that remains', () => {
		const json = JSON.stringify(
			TestRenderer.create(
				<PDFMetricTileTable
					title="Top performing keywords"
					rows={ [
						{
							primary: 'lagos para nadar perto de mim',
							metric: '100% CTR',
						},
					] }
				/>
			).toJSON()
		);

		expect( json ).toContain(
			`"flexGrow":1,"flexShrink":1,"flexBasis":0,"marginRight":${ scalePDFValue(
				20
			) }`
		);
	} );

	it( 'gives the card the dashboard tile min height so a row of tiles is uniform', () => {
		const tree = TestRenderer.create(
			<PDFMetricTileTable
				title="Top pages"
				rows={ [ { primary: 'A page', metric: '1' } ] }
			/>
		).toJSON();
		const json = JSON.stringify( tree );

		// The dashboard tile is `min-height: 150px` and fills its grid cell, so the
		// card carries the scaled min height and grows to the row's tallest tile.
		expect( json ).toContain( `"minHeight":${ scalePDFValue( 150 ) }` );
		expect( json ).toContain( '"flexGrow":1' );
	} );

	it( 'colours the label like a link only when the dashboard tile links it', () => {
		const linked = JSON.stringify(
			TestRenderer.create(
				<PDFMetricTileTable
					title="Top pages"
					rows={ [ { primary: '/home', metric: '37' } ] }
					linked
				/>
			).toJSON()
		);
		const plain = JSON.stringify(
			TestRenderer.create(
				<PDFMetricTileTable
					title="Top cities"
					rows={ [ { primary: 'Dublin', metric: '37' } ] }
				/>
			).toJSON()
		);

		expect( linked ).toContain( '#108080' );
		expect( plain ).not.toContain( '#108080' );
	} );

	it( 'renders only the title when there are no rows', () => {
		const strings = renderTable( { title: 'Top cities', rows: [] } );

		expect( strings ).toEqual( [ 'Top cities' ] );
	} );
} );
