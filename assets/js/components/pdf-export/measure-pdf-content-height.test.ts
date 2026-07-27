/**
 * Tests for measurePDFContentHeight.
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
 * Internal dependencies
 */
import measurePDFContentHeight from './measure-pdf-content-height';

const EXPECTED_PATH =
	'layout._INTERNAL__LAYOUT__DATA_.children[0].children[].box.{top,height}';

function buildLayout( children: unknown ) {
	return {
		_INTERNAL__LAYOUT__DATA_: {
			children: [ { children } ],
		},
	};
}

describe( 'measurePDFContentHeight', () => {
	it( 'returns the maximum bottom edge (top + height) across the page children', () => {
		const layout = buildLayout( [
			{ box: { top: 0, height: 120 } },
			{ box: { top: 150, height: 700 } },
			{ box: { top: 500, height: 100 } },
		] );

		expect( measurePDFContentHeight( layout ) ).toBe( 850 );
	} );

	it( 'returns the bottom edge of a single child', () => {
		const layout = buildLayout( [ { box: { top: 24, height: 476 } } ] );

		expect( measurePDFContentHeight( layout ) ).toBe( 500 );
	} );

	it.each( [
		[ 'the layout is undefined', undefined ],
		[ 'the layout is null', null ],
		[ 'the internal layout data is missing', {} ],
		[
			'the internal layout data has no children array',
			{ _INTERNAL__LAYOUT__DATA_: {} },
		],
		[
			'the first page is missing',
			{ _INTERNAL__LAYOUT__DATA_: { children: [] } },
		],
		[
			'the first page has no children array',
			{ _INTERNAL__LAYOUT__DATA_: { children: [ {} ] } },
		],
		[ 'the first page has no children', buildLayout( [] ) ],
		[
			'a child has no box',
			buildLayout( [ { box: { top: 0, height: 100 } }, {} ] ),
		],
		[
			'a child box has no numeric top',
			buildLayout( [ { box: { height: 100 } } ] ),
		],
		[
			'a child box has no numeric height',
			buildLayout( [ { box: { top: 100 } } ] ),
		],
		[
			'the computed height is non-positive',
			buildLayout( [ { box: { top: 0, height: 0 } } ] ),
		],
	] )(
		'throws an error naming the expected property path when %s',
		( _description, layout ) => {
			expect( () => measurePDFContentHeight( layout ) ).toThrow(
				EXPECTED_PATH
			);
		}
	);
} );
