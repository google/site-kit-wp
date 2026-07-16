/**
 * PDFNumericMetricTile tests.
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
import { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import PDFNumericMetricTile from './PDFNumericMetricTile';

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

function renderTile(
	props: ComponentProps< typeof PDFNumericMetricTile >
): TestRenderer.ReactTestRendererJSON {
	const tree = TestRenderer.create(
		<PDFNumericMetricTile { ...props } />
	).toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

describe( 'PDFNumericMetricTile', () => {
	it( 'renders the title, value, subtext, and change badge inside a white card', () => {
		const tree = renderTile( {
			title: 'New visitors',
			value: '12K',
			subtext: 'of 1,234 total visitors',
			change: '+5.1%',
		} );

		const text = findTextStrings( tree ).join( ' ' );
		expect( text ).toContain( 'New visitors' );
		expect( text ).toContain( '12K' );
		expect( text ).toContain( 'of 1,234 total visitors' );
		expect( text ).toContain( '+5.1%' );

		const json = JSON.stringify( tree );
		// White card background.
		expect( json ).toContain( '#ffffff' );
		// The heading uses the on-surface-variant color.
		expect( json ).toContain( '#6c726e' );
		// The value scales the 28px headline size.
		expect( json ).toContain( `"fontSize":${ 28 * PDF_SCALE }` );
		// The title scales the 12px body size.
		expect( json ).toContain( `"fontSize":${ 12 * PDF_SCALE }` );
	} );

	it( 'omits the subtext and the badge when they are not provided', () => {
		const tree = renderTile( { title: 'New visitors', value: '12K' } );

		const text = findTextStrings( tree ).join( ' ' );
		expect( text ).toContain( '12K' );
		expect( text ).not.toContain( 'total visitors' );

		const json = JSON.stringify( tree );
		// No change chip colors.
		expect( json ).not.toContain( '#d8ffc0' );
		expect( json ).not.toContain( '#ffded3' );
	} );

	it( 'renders a positive change as a green chip and a negative change as a red chip', () => {
		const positive = JSON.stringify(
			renderTile( { title: 'x', value: '1', change: '+5.1%' } )
		);
		expect( positive ).toContain( '#d8ffc0' );

		const negative = JSON.stringify(
			renderTile( {
				title: 'x',
				value: '1',
				change: '-5.0%',
				isNegative: true,
			} )
		);
		expect( negative ).toContain( '#ffded3' );
	} );
} );
