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

/**
 * Internal dependencies
 */
import {
	renderJSON,
	renderPDFStyle,
} from '@/js/components/pdf-export/test-utils';
import PDFAudienceTopContentRow from './PDFAudienceTopContentRow';

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
 * @param props Props that override the defaults.
 * @return The element.
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

describe( 'PDFAudienceTopContentRow', () => {
	it( 'renders each top content row with its title and pageviews', () => {
		const json = renderJSON( buildRow() );

		expect( json ).toContain( 'Top content by pageviews' );
		expect( json ).toContain( 'First post title' );
		expect( json ).toContain( '847' );
		expect( json ).toContain( 'Second post title' );
		expect( json ).toContain( '596' );
	} );

	it( 'shows a no data message when there is no top content', () => {
		expect( renderJSON( buildRow( { topContent: [] } ) ) ).toContain(
			'No data to show yet'
		);
	} );

	it( 'shows the Partial data badge only when the top content is in a partial data state', () => {
		expect(
			renderJSON( buildRow( { isTopContentPartialData: true } ) )
		).toContain( 'Partial data' );

		expect( renderJSON( buildRow() ) ).not.toContain( 'Partial data' );
	} );

	it( 'fills its cell and drops the divider as the last section of the card', () => {
		expect( renderPDFStyle( buildRow() ) ).toMatchObject( {
			flexGrow: 1,
			borderBottomWidth: 0,
		} );
	} );

	it( 'links each top content title to its Analytics report', () => {
		const json = renderJSON( buildRow() );

		expect( json ).toContain( TOP_CONTENT[ 0 ].serviceURL );
		expect( json ).toContain( TOP_CONTENT[ 1 ].serviceURL );
		// The `Link` primitive from `@react-pdf` renders as `pdf-link` under
		// the test mock. So a `pdf-link` in the tree means the title rendered
		// as a link, not as text that happens to hold the URL.
		expect( json ).toContain( 'pdf-link' );
	} );

	it( 'renders each top content title as plain text when a row has no link', () => {
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
} );
