/**
 * PDFAudienceCitiesRow tests.
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
import { renderJSON } from '@/js/components/pdf-export/test-utils';
import PDFAudienceCitiesRow from './PDFAudienceCitiesRow';

/**
 * Gets the hyphenation callback the given city name's text renders with.
 *
 * @since n.e.x.t
 *
 * @param name The city name.
 * @return The text's hyphenation callback, or `undefined` when it has none.
 */
function getCityNameHyphenationCallback( name: string ) {
	const renderer = TestRenderer.create(
		<PDFAudienceCitiesRow topCities={ [ { name, percentage: 0.5 } ] } />
	);
	const [ text ] = renderer.root.findAllByProps( { children: name } );

	return text.props.hyphenationCallback;
}

describe( 'PDFAudienceCitiesRow', () => {
	it( 'renders each top city with its name and percentage', () => {
		const json = renderJSON(
			<PDFAudienceCitiesRow
				topCities={ [
					{ name: 'Dublin', percentage: 0.388 },
					{ name: 'London', percentage: 0.126 },
					{ name: 'New York', percentage: 0.094 },
				] }
			/>
		);

		expect( json ).toContain( 'Cities with the most visitors' );
		expect( json ).toContain( 'Dublin' );
		expect( json ).toContain( '38.8%' );
		expect( json ).toContain( 'London' );
		expect( json ).toContain( 'New York' );
	} );

	it( 'shows a no data message when there are no top cities', () => {
		expect(
			renderJSON( <PDFAudienceCitiesRow topCities={ [] } /> )
		).toContain( 'No data to show yet' );
	} );

	it( 'truncates a long city name to one line with an ellipsis', () => {
		const json = renderJSON(
			<PDFAudienceCitiesRow
				topCities={ [
					{
						name: 'Municipal District of Bandon - Kinsale',
						percentage: 0.5,
					},
				] }
			/>
		);

		expect( json ).toContain( 'Municipal District of Bandon - Kinsale' );
		// `@react-pdf` wraps text by default, so the city name caps at one line
		// with an ellipsis.
		expect( json ).toContain( '"maxLines":1' );
		expect( json ).toContain( '"textOverflow":"ellipsis"' );
	} );

	it( 'lets a city name with no space wrap between any two characters', () => {
		const hyphenationCallback =
			getCityNameHyphenationCallback( 'Vacoas-Phoenix' );

		// `@react-pdf` breaks a line at an empty part without adding a hyphen.
		expect( hyphenationCallback( 'Cork' ) ).toEqual( [
			'C',
			'',
			'o',
			'',
			'r',
			'',
			'k',
		] );
	} );

	it( 'keeps a city name with a space wrapping only at its spaces', () => {
		expect(
			getCityNameHyphenationCallback( 'Beau Bassin-Rose Hill' )
		).toBeUndefined();
	} );
} );
