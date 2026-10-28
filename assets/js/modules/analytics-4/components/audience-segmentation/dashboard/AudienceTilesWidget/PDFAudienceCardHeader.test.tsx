/**
 * PDFAudienceCardHeader tests.
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
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { PDF_PARTIAL_DATA_BADGE_HEIGHT } from '@/js/components/pdf-export/shared-react-pdf-components/PDFPartialDataBadge';
import {
	flattenPDFStyle,
	renderJSON,
	renderPDFStyle,
} from '@/js/components/pdf-export/test-utils';
import PDFAudienceCardHeader from './PDFAudienceCardHeader';

/**
 * Renders the header and returns its title row.
 *
 * @since n.e.x.t
 *
 * @param audienceName          The audience name.
 * @param isAudiencePartialData Whether to show the Partial data badge.
 * @return The row holding the audience name and the badge.
 */
function renderTitleRow(
	audienceName: string,
	isAudiencePartialData: boolean
) {
	const tree = TestRenderer.create(
		<PDFAudienceCardHeader
			audienceName={ audienceName }
			isAudiencePartialData={ isAudiencePartialData }
		/>
	).toJSON() as TestRenderer.ReactTestRendererJSON;

	const [ titleRow ] = tree.children as TestRenderer.ReactTestRendererJSON[];

	return titleRow;
}

describe( 'PDFAudienceCardHeader', () => {
	it( 'should render the audience name', () => {
		expect(
			renderJSON(
				<PDFAudienceCardHeader
					audienceName="New visitors"
					isAudiencePartialData={ false }
				/>
			)
		).toContain( 'New visitors' );
	} );

	it( 'should show the Partial data badge only when the audience is in a partial data state', () => {
		expect(
			renderJSON(
				<PDFAudienceCardHeader
					audienceName="New visitors"
					isAudiencePartialData
				/>
			)
		).toContain( 'Partial data' );

		expect(
			renderJSON(
				<PDFAudienceCardHeader
					audienceName="New visitors"
					isAudiencePartialData={ false }
				/>
			)
		).not.toContain( 'Partial data' );
	} );

	it( 'should fill its grid cell', () => {
		expect(
			renderPDFStyle(
				<PDFAudienceCardHeader
					audienceName="New visitors"
					isAudiencePartialData={ false }
				/>
			)
		).toMatchObject( { flexGrow: 1 } );
	} );

	it( 'should wrap a long name in the width the badge leaves, with a gap before the badge', () => {
		const titleRow = renderTitleRow(
			'Visitors who completed a purchase in the last thirty days',
			true
		);
		const [ name, badge ] =
			titleRow.children as TestRenderer.ReactTestRendererJSON[];

		expect( flattenPDFStyle( titleRow.props.style ) ).toMatchObject( {
			columnGap: scalePDFValue( 10 ),
		} );
		expect( flattenPDFStyle( name.props.style ) ).toMatchObject( {
			flex: 1,
		} );
		expect( JSON.stringify( badge ) ).toContain( 'Partial data' );
	} );

	it( 'should reserve the Partial data badge height on the title row with or without a badge', () => {
		const minHeight = scalePDFValue( PDF_PARTIAL_DATA_BADGE_HEIGHT );

		for ( const isAudiencePartialData of [ true, false ] ) {
			const titleRow = renderTitleRow(
				'New visitors',
				isAudiencePartialData
			);

			expect( flattenPDFStyle( titleRow.props.style ) ).toMatchObject( {
				minHeight,
			} );
		}
	} );
} );
