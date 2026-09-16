/**
 * Tests for extractPDFSectionAnchors.
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
import extractPDFSectionAnchors from './extract-pdf-section-anchors';

function buildLayout( pageChildren: unknown ) {
	return {
		_INTERNAL__LAYOUT__DATA_: {
			children: [ { box: { top: 0 }, children: pageChildren } ],
		},
	};
}

describe( 'extractPDFSectionAnchors', () => {
	it( 'returns each section id with its absolute top, summing the offsets down the tree', () => {
		const layout = buildLayout( [
			{ box: { top: 24, height: 100 } },
			{
				box: { top: 148, height: 550 },
				children: [
					{
						props: { id: 'section-mainDashboardTraffic' },
						box: { top: 0, height: 200 },
					},
					{
						props: { id: 'section-mainDashboardContent' },
						box: { top: 250, height: 300 },
					},
				],
			},
		] );

		expect( extractPDFSectionAnchors( layout ) ).toEqual( [
			{ id: 'section-mainDashboardTraffic', top: 148 },
			{ id: 'section-mainDashboardContent', top: 398 },
		] );
	} );

	it( 'ignores nodes whose id does not carry the section prefix', () => {
		const layout = buildLayout( [
			{ props: { id: 'header' }, box: { top: 24, height: 100 } },
			{
				props: { id: 'section-mainDashboardTraffic' },
				box: { top: 148, height: 200 },
			},
		] );

		expect( extractPDFSectionAnchors( layout ) ).toEqual( [
			{ id: 'section-mainDashboardTraffic', top: 148 },
		] );
	} );

	it( 'treats a node without a box as adding no offset', () => {
		const layout = buildLayout( [
			{
				children: [
					{
						props: { id: 'section-mainDashboardTraffic' },
						box: { top: 148, height: 200 },
					},
				],
			},
		] );

		expect( extractPDFSectionAnchors( layout ) ).toEqual( [
			{ id: 'section-mainDashboardTraffic', top: 148 },
		] );
	} );

	it.each( [
		[ 'the layout is undefined', undefined ],
		[ 'the layout is null', null ],
		[ 'the internal layout data is missing', {} ],
		[
			'the layout holds no pages',
			{ _INTERNAL__LAYOUT__DATA_: { children: [] } },
		],
		[
			'the page holds no sections',
			buildLayout( [ { box: { top: 24 } } ] ),
		],
	] )( 'returns an empty list when %s', ( _description, layout ) => {
		expect( extractPDFSectionAnchors( layout ) ).toEqual( [] );
	} );
} );
