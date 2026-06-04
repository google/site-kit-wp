/**
 * PDFMetricTile tests.
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
import type { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import PDFMetricTile from './PDFMetricTile';

function findTextStrings( tree: TestRenderer.ReactTestRendererJSON ): string[] {
	const textOutput: string[] = [];

	function visit(
		node:
			| string
			| number
			| TestRenderer.ReactTestRendererJSON
			| null
			| undefined
	) {
		if ( node === null || node === undefined ) {
			return;
		}
		if ( typeof node === 'string' ) {
			textOutput.push( node );
			return;
		}
		if ( typeof node === 'number' ) {
			textOutput.push( String( node ) );
			return;
		}
		const children = node.children;
		if ( Array.isArray( children ) ) {
			children.forEach( visit );
		}
	}

	visit( tree );
	return textOutput;
}

function renderTile(
	props: ComponentProps< typeof PDFMetricTile >
): TestRenderer.ReactTestRendererJSON {
	const renderer = TestRenderer.create( <PDFMetricTile { ...props } /> );
	const tree = renderer.toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

describe( 'PDFMetricTile', () => {
	it( 'renders the title, value, and change label', () => {
		const tree = renderTile( {
			title: 'All visitors',
			value: '32.6K',
			changeLabel: 'Vs. prev. 28 days',
		} );

		const text = findTextStrings( tree ).join( ' ' );
		expect( text ).toContain( 'All visitors' );
		expect( text ).toContain( '32.6K' );
		expect( text ).toContain( 'Vs. prev. 28 days' );
	} );

	it( 'omits the change label when not provided', () => {
		const tree = renderTile( {
			title: 'All visitors',
			value: '32.6K',
		} );

		expect( findTextStrings( tree ).join( ' ' ) ).not.toContain(
			'Vs. prev.'
		);
	} );

	it( 'renders a positive change as a green chip with the signed string and no arrow', () => {
		const tree = renderTile( {
			title: 'All visitors',
			value: '32.6K',
			change: '+5.1%',
		} );

		const json = JSON.stringify( tree );
		expect( json ).toContain( '+5.1%' );
		// Green chip background + text.
		expect( json ).toContain( '#d8ffc0' );
		expect( json ).toContain( '#1f4c04' );
		// No arrow SVG path.
		expect( json ).not.toContain( ' L8,8 L0,8 Z' );
	} );

	it( 'renders a negative change as a red chip', () => {
		const tree = renderTile( {
			title: 'All visitors',
			value: '32.6K',
			change: '-5.0%',
			isNegative: true,
		} );

		const json = JSON.stringify( tree );
		expect( json ).toContain( '-5.0%' );
		expect( json ).toContain( '#ffded3' );
		expect( json ).toContain( '#7a1e00' );
	} );

	it( 'omits the change chip when change is not provided', () => {
		const tree = renderTile( {
			title: 'All visitors',
			value: '32.6K',
		} );

		const json = JSON.stringify( tree );
		expect( json ).not.toContain( '#d8ffc0' );
		expect( json ).not.toContain( '#ffded3' );
	} );
} );
