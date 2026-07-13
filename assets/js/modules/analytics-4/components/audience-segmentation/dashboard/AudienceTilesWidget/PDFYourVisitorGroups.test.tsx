/**
 * PDFYourVisitorGroups tests.
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
import PDFYourVisitorGroups from './PDFYourVisitorGroups';

/**
 * Builds a loaded audience card fixture with the given name.
 *
 * @since n.e.x.t
 *
 * @param name The audience name, used for the resource name and display name.
 * @return A fully loaded audience card object.
 */
function buildAudience( name: string ) {
	return {
		audienceResourceName: `properties/1/audiences/${ name }`,
		audienceName: name,
		metrics: {
			visitors: { current: 10, previous: 10 },
			visitsPerVisitor: { current: 1, previous: 1 },
			pagesPerVisit: { current: 1, previous: 1 },
			pageviews: {
				current: 5,
				previous: 5,
				percentageOfTotalPageViews: 0.5,
			},
		},
		topCities: [],
		topContent: [],
	};
}

/**
 * Renders `PDFYourVisitorGroups` with the given props to its JSON tree.
 *
 * @since n.e.x.t
 *
 * @param props The widget props.
 * @return The rendered tree, or `null` when the widget renders nothing.
 */
function renderWidget( props: ComponentProps< typeof PDFYourVisitorGroups > ) {
	return TestRenderer.create(
		<PDFYourVisitorGroups { ...props } />
	).toJSON();
}

/**
 * Counts the rendered cards by their "Cities with the most visitors" headings.
 *
 * @since n.e.x.t
 *
 * @param json The rendered tree serialized to a string.
 * @return The number of audience cards in the tree.
 */
function countCards( json: string ) {
	return json.split( 'Cities with the most visitors' ).length - 1;
}

describe( 'AudienceTilesWidget PDF', () => {
	it( 'renders the heading and two cards for two audiences', () => {
		const tree = renderWidget( {
			data: {
				audiences: [
					buildAudience( 'New' ),
					buildAudience( 'Returning' ),
				],
			},
		} );
		const json = JSON.stringify( tree );

		expect( json ).toContain( 'Your visitor groups' );
		expect( json ).toContain( 'New' );
		expect( json ).toContain( 'Returning' );
		expect( countCards( json ) ).toBe( 2 );
	} );

	it( 'renders three cards for three audiences', () => {
		const tree = renderWidget( {
			data: {
				audiences: [
					buildAudience( 'New' ),
					buildAudience( 'Returning' ),
					buildAudience( 'Purchasers' ),
				],
			},
		} );

		expect( countCards( JSON.stringify( tree ) ) ).toBe( 3 );
	} );

	it( 'renders nothing for an empty audiences array', () => {
		expect( renderWidget( { data: { audiences: [] } } ) ).toBeNull();
	} );

	it( 'renders nothing when data is null', () => {
		expect( renderWidget( { data: null } ) ).toBeNull();
	} );

	it( 'renders nothing when data is undefined', () => {
		expect( renderWidget( {} ) ).toBeNull();
	} );
} );
