/**
 * PDFMetricTileText tests.
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
import PDFMetricTileText from './PDFMetricTileText';

/**
 * Collects every text string rendered in a react-test-renderer tree, so a test
 * can assert on the tile copy without walking the tree itself.
 *
 * @since 1.186.0
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
 * Renders `PDFMetricTileText` with the given props and returns its JSON tree.
 *
 * @since 1.186.0
 *
 * @param {Object} props The tile props.
 * @return {Object} The rendered tree.
 */
function renderTextTree(
	props: React.ComponentProps< typeof PDFMetricTileText >
): TestRenderer.ReactTestRendererJSON {
	const tree = TestRenderer.create(
		<PDFMetricTileText { ...props } />
	).toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

/**
 * Renders `PDFMetricTileText` and returns its collected text, space-joined.
 *
 * @since 1.186.0
 *
 * @param {Object} props The tile props.
 * @return {string} The rendered text.
 */
function renderText(
	props: React.ComponentProps< typeof PDFMetricTileText >
): string {
	return findTextStrings( renderTextTree( props ) ).join( ' ' );
}

describe( 'PDFMetricTileText', () => {
	it( 'renders the title, value, sub-text, and change', () => {
		const text = renderText( {
			title: 'Top traffic source',
			value: 'Organic Search',
			subtext: '3.4K visitors',
			change: '+5.1%',
			changeType: 'positive',
		} );

		expect( text ).toContain( 'Top traffic source' );
		expect( text ).toContain( 'Organic Search' );
		expect( text ).toContain( '3.4K visitors' );
		expect( text ).toContain( '+5.1%' );
	} );

	it( 'omits the sub-text when none is provided', () => {
		const text = renderText( {
			title: 'Top traffic source',
			value: 'Organic Search',
		} );

		expect( text ).toContain( 'Organic Search' );
		expect( text ).not.toContain( 'visitors' );
	} );

	it( 'omits the change badge when no change is provided', () => {
		// The same props, with and without a change, so the assertion pins the
		// omission to the missing `change` rather than to copy that never renders.
		const withChange = renderText( {
			title: 'Top traffic source',
			value: 'Organic Search',
			change: '+5.1%',
		} );
		const withoutChange = renderText( {
			title: 'Top traffic source',
			value: 'Organic Search',
		} );

		expect( withChange ).toContain( '+5.1%' );
		expect( withoutChange ).not.toContain( '+5.1%' );
	} );

	it( 'colours the badge green for a positive change and red for a negative one', () => {
		const positive = JSON.stringify(
			renderTextTree( {
				title: 'Top traffic source',
				value: 'Organic Search',
				change: '+5.1%',
			} )
		);
		// The rise chip background.
		expect( positive ).toContain( '#d8ffc0' );

		const negative = JSON.stringify(
			renderTextTree( {
				title: 'Top traffic source',
				value: 'Organic Search',
				change: '-5.0%',
				changeType: 'negative',
			} )
		);
		// The fall chip background.
		expect( negative ).toContain( '#ffded3' );
	} );
} );
