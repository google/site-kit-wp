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
			title: 'All Visitors',
			value: '1,234',
			changeLabel: 'compared to the previous 28 days',
		} );

		const text = findTextStrings( tree ).join( ' ' );
		expect( text ).toContain( 'All Visitors' );
		expect( text ).toContain( '1,234' );
		expect( text ).toContain( 'compared to the previous 28 days' );
	} );

	it( 'omits the change label when not provided', () => {
		const tree = renderTile( {
			title: 'All Visitors',
			value: '1,234',
		} );

		expect( findTextStrings( tree ).join( ' ' ) ).not.toContain(
			'compared to the previous'
		);
	} );

	it( 'renders the up percentage change badge with the success color', () => {
		const tree = renderTile( {
			title: 'All Visitors',
			value: '1,234',
			change: '12.5%',
			changeDirection: 'up',
		} );

		const json = JSON.stringify( tree );
		expect( json ).toContain( '12.5%' );
		expect( json ).toContain( 'M4,0 L8,8 L0,8 Z' );
		expect( json ).toContain( '#34a853' );
	} );

	it( 'renders the down percentage change badge with the error color', () => {
		const tree = renderTile( {
			title: 'All Visitors',
			value: '1,234',
			change: '5.0%',
			changeDirection: 'down',
		} );

		const json = JSON.stringify( tree );
		expect( json ).toContain( '5.0%' );
		expect( json ).toContain( 'M0,0 L8,0 L4,8 Z' );
		expect( json ).toContain( '#ea4335' );
	} );

	it( 'omits the change badge when change is not provided', () => {
		const tree = renderTile( {
			title: 'All Visitors',
			value: '1,234',
		} );

		const json = JSON.stringify( tree );
		expect( json ).not.toContain( '#34a853' );
		expect( json ).not.toContain( '#ea4335' );
	} );
} );
