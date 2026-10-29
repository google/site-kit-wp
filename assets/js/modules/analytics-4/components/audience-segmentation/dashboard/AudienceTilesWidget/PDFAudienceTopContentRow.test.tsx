/**
 * PDFAudienceTopContentRow tests.
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
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import PDFLink from '@/js/components/pdf-export/shared-react-pdf-components/PDFLink';
import {
	flattenPDFStyle,
	renderJSON,
	renderPDFStyle,
} from '@/js/components/pdf-export/test-utils';
import PDFAudienceTopContentRow from './PDFAudienceTopContentRow';
import { splitIntoCharacters } from './pdfTextTruncation';

const TOP_CONTENT = [
	{
		title: 'First post title',
		pageviews: 847,
		serviceURL: 'https://example.com/analytics-report/first-post',
	},
	{
		title: 'Second post title',
		pageviews: 596,
		serviceURL: 'https://example.com/analytics-report/second-post',
	},
];

/**
 * Builds a `PDFAudienceTopContentRow` element with default props.
 *
 * @since n.e.x.t
 *
 * @param {Object} props Props that override the defaults.
 * @return {Element} The element.
 */
function buildRow(
	props: Partial< ComponentProps< typeof PDFAudienceTopContentRow > > = {}
) {
	return (
		<PDFAudienceTopContentRow
			topContent={ TOP_CONTENT }
			isTopContentPartialData={ false }
			{ ...props }
		/>
	);
}

/**
 * Finds every node in a rendered tree that matches the predicate, in render
 * order.
 *
 * @since n.e.x.t
 *
 * @param {Object}   node      The rendered tree, or a node within it.
 * @param {Function} predicate Whether a node matches.
 * @return {Array.<Object>} The matching nodes.
 */
function findNodes(
	node: TestRenderer.ReactTestRendererJSON,
	predicate: ( node: TestRenderer.ReactTestRendererJSON ) => boolean
): TestRenderer.ReactTestRendererJSON[] {
	const children = ( node.children ?? [] ).filter(
		( child ): child is TestRenderer.ReactTestRendererJSON =>
			typeof child === 'object'
	);

	return [
		...( predicate( node ) ? [ node ] : [] ),
		...children.flatMap( ( child ) => findNodes( child, predicate ) ),
	];
}

describe( 'PDFAudienceTopContentRow', () => {
	it( 'should render each top content row with its title and pageviews', () => {
		const json = renderJSON( buildRow() );

		expect( json ).toContain( 'Top content by pageviews' );
		expect( json ).toContain( 'First post title' );
		expect( json ).toContain( '847' );
		expect( json ).toContain( 'Second post title' );
		expect( json ).toContain( '596' );
	} );

	it( 'should show a no data message when there is no top content', () => {
		expect( renderJSON( buildRow( { topContent: [] } ) ) ).toContain(
			'No data to show yet'
		);
	} );

	it( 'should show the Partial data badge only when the top content is in a partial data state', () => {
		expect(
			renderJSON( buildRow( { isTopContentPartialData: true } ) )
		).toContain( 'Partial data' );

		expect( renderJSON( buildRow() ) ).not.toContain( 'Partial data' );
	} );

	it( 'should reserve the Partial data badge height on the title without a badge', () => {
		expect( renderJSON( buildRow() ) ).toContain(
			`"minHeight":${ scalePDFValue( 28 ) }`
		);
	} );

	it( 'should keep the title row free of a gap before the Partial data badge', () => {
		const tree = TestRenderer.create(
			buildRow( { isTopContentPartialData: true } )
		).toJSON() as TestRenderer.ReactTestRendererJSON;
		const [ titleRow ] = findNodes(
			tree,
			( node ) => 'minHeight' in flattenPDFStyle( node.props.style )
		);
		const [ title ] =
			titleRow.children as TestRenderer.ReactTestRendererJSON[];

		expect( flattenPDFStyle( titleRow.props.style ) ).not.toHaveProperty(
			'columnGap'
		);
		expect( flattenPDFStyle( title.props.style ) ).toMatchObject( {
			flex: 1,
		} );
	} );

	it( 'should fill its grid cell with no divider below', () => {
		expect( renderPDFStyle( buildRow() ) ).toMatchObject( {
			flexGrow: 1,
			borderBottomWidth: 0,
		} );
	} );

	it( 'should link each top content title to its Analytics report', () => {
		const json = renderJSON( buildRow() );

		expect( json ).toContain( TOP_CONTENT[ 0 ].serviceURL );
		expect( json ).toContain( TOP_CONTENT[ 1 ].serviceURL );
		// The `Link` primitive from `@react-pdf` renders as `pdf-link` under
		// the test mock. So a `pdf-link` in the tree means the title rendered
		// as a link, not as text that happens to hold the URL.
		expect( json ).toContain( 'pdf-link' );
	} );

	it( 'should render each top content title as plain text when a row has no link', () => {
		// An empty `serviceURL` gives every row an empty link, so each title
		// renders as plain text.
		const json = renderJSON(
			buildRow( {
				topContent: TOP_CONTENT.map( ( content ) => ( {
					...content,
					serviceURL: '',
				} ) ),
			} )
		);

		expect( json ).toContain( 'First post title' );
		expect( json ).toContain( 'Second post title' );
		// No `pdf-link` in the tree means every title rendered as plain text.
		expect( json ).not.toContain( 'pdf-link' );
	} );

	it( 'should let a linked title with no spaces break between characters', () => {
		const pagePath = '/2024/05/a-very-long-slug-with-no-spaces/';
		const renderer = TestRenderer.create(
			buildRow( {
				topContent: [
					{
						title: pagePath,
						pageviews: 12,
						serviceURL: 'https://example.com/analytics-report/slug',
					},
					TOP_CONTENT[ 0 ],
				],
			} )
		);
		const [ pathLink, titleLink ] = renderer.root.findAllByType( PDFLink );

		expect( pathLink.props.hyphenationCallback ).toBe(
			splitIntoCharacters
		);
		expect( pathLink.props.href ).toBe(
			'https://example.com/analytics-report/slug'
		);
		expect( titleLink.props.hyphenationCallback ).toBeUndefined();
		expect( titleLink.props.href ).toBe( TOP_CONTENT[ 0 ].serviceURL );
	} );
} );
