/**
 * KeyMetricsPDF tests.
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
import { FC } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { KeyMetricsPDFTile } from './getPDFData';
import KeyMetricsPDF from './KeyMetricsPDF';

/**
 * Collects every text string rendered in a react-test-renderer tree, so a test
 * can assert on the tile copy without walking the tree itself.
 *
 * @since 1.184.0
 *
 * @param node   The current tree node.
 * @param output The strings collected so far.
 * @return The collected text strings.
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
 * Renders `KeyMetricsPDF` with the given tiles and returns its JSON tree.
 *
 * @since 1.184.0
 *
 * @param tiles The tiles to render.
 * @return The rendered tree.
 */
function render(
	tiles: KeyMetricsPDFTile[]
): TestRenderer.ReactTestRendererJSON | null {
	const renderer = TestRenderer.create(
		<KeyMetricsPDF data={ { tiles } } />
	);
	const tree = renderer.toJSON();
	if ( Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

// Typed with the aggregate's own render-prop shape, matching how a real tile is
// handed to `KeyMetricsPDF` after `getPDFData` widens it.
const NumericTile: FC< Record< string, unknown > > = ( { title, value } ) => (
	<Text>{ `${ title }: ${ value }` }</Text>
);

describe( 'KeyMetricsPDF', () => {
	it( 'renders one tile per configured metric in a four-column grid', () => {
		const tree = render( [
			{
				slug: 'metricA',
				title: 'New visitors',
				TileComponent: NumericTile,
				data: { value: '42' },
			},
			{
				slug: 'metricB',
				title: 'Returning visitors',
				TileComponent: NumericTile,
				data: { value: '17' },
			},
		] );

		const json = JSON.stringify( tree );
		// The grid is a wrapping flex row of quarter-width tiles.
		expect( json ).toContain( '"flexDirection":"row"' );
		expect( json ).toContain( '"flexWrap":"wrap"' );
		expect( json ).toContain( '"width":"25%"' );

		const text = findTextStrings( tree ).join( ' ' );
		expect( text ).toContain( 'New visitors: 42' );
		expect( text ).toContain( 'Returning visitors: 17' );
	} );

	it( 'passes the title and the tile data fields to each TileComponent', () => {
		let receivedProps: Record< string, unknown > | undefined;
		const TileComponent = jest.fn( ( props: Record< string, unknown > ) => {
			receivedProps = props;
			return null;
		} );

		render( [
			{
				slug: 'metricA',
				title: 'New visitors',
				TileComponent,
				data: { value: '42', change: '+5.1%', changeType: 'positive' },
			},
		] );

		expect( receivedProps ).toEqual( {
			title: 'New visitors',
			value: '42',
			change: '+5.1%',
			changeType: 'positive',
		} );
	} );

	it( 'renders exactly the tiles it is given, so the grid reflows with no gaps', () => {
		// The aggregate loader drops no-data tiles before this component, so every
		// tile here renders and there is no per-tile placeholder.
		const tree = render( [
			{
				slug: 'metricA',
				title: 'New visitors',
				TileComponent: NumericTile,
				data: { value: '42' },
			},
			{
				slug: 'metricC',
				title: 'Visit length',
				TileComponent: NumericTile,
				data: { value: '3m' },
			},
		] );

		const text = findTextStrings( tree ).join( ' ' );
		expect( text ).toContain( 'New visitors: 42' );
		expect( text ).toContain( 'Visit length: 3m' );
		// No placeholder copy is ever rendered.
		expect( text ).not.toContain( 'Data unavailable' );
	} );

	it( 'renders no tiles when the tile list is empty', () => {
		const tree = render( [] );

		expect( findTextStrings( tree ) ).toEqual( [] );
	} );
} );
