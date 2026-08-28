/**
 * SiteGoalsTileConnectorPDF tests.
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
import TestRenderer, { ReactTestRendererJSON } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import SiteGoalsTileConnectorPDF from './SiteGoalsTileConnectorPDF';

/**
 * Renders the connector and reads the flattened style of each shape it draws.
 *
 * A shape takes its style as one object or as an array of them, so each style is
 * flattened into a single object before the assertions read it.
 *
 * @since n.e.x.t
 *
 * @return {Array<Object>} The style of every shape the connector draws, top to bottom.
 */
function renderConnectorShapeStyles(): Record< string, unknown >[] {
	const tree = TestRenderer.create(
		<SiteGoalsTileConnectorPDF />
	).toJSON() as ReactTestRendererJSON;

	return ( tree.children ?? [] ).map( ( child ) => {
		const style = ( child as ReactTestRendererJSON ).props.style;

		return Object.assign( {}, ...[ style ].flat() );
	} );
}

/**
 * Renders the connector and reads the flattened style of the column it draws in.
 *
 * @since n.e.x.t
 *
 * @return {Object} The style of the connector's own column.
 */
function renderConnectorColumnStyle(): Record< string, unknown > {
	const tree = TestRenderer.create(
		<SiteGoalsTileConnectorPDF />
	).toJSON() as ReactTestRendererJSON;

	return Object.assign( {}, ...[ tree.props.style ].flat() );
}

describe( 'SiteGoalsTileConnectorPDF', () => {
	it( 'breaks the divider line with a round dot near its top', () => {
		const [ lineAboveDot, dot ] = renderConnectorShapeStyles();

		expect( lineAboveDot.width ).toBe( scalePDFValue( 2 ) );
		expect( lineAboveDot.height ).toBe( scalePDFValue( 12 ) );
		expect( dot.width ).toBe( scalePDFValue( 9 ) );
		expect( dot.height ).toBe( scalePDFValue( 9 ) );
		expect( dot.borderRadius ).toBe( scalePDFValue( 4.5 ) );
	} );

	it( 'runs the line below the dot to the end of the column', () => {
		const lineBelowDot = renderConnectorShapeStyles()[ 2 ];

		expect( lineBelowDot.width ).toBe( scalePDFValue( 2 ) );
		expect( lineBelowDot.flex ).toBe( 1 );
	} );

	it( 'sets the gap above and below the divider line', () => {
		const column = renderConnectorColumnStyle();

		expect( column.marginVertical ).toBe( scalePDFValue( 14 ) );
	} );

	it( 'draws the dot and both line segments in one color', () => {
		renderConnectorShapeStyles().forEach( ( shape ) => {
			expect( shape.backgroundColor ).toBe(
				PDF_COLORS.SURFACES_SURFACE_1
			);
		} );
	} );
} );
