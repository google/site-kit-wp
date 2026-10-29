/**
 * PDFAudienceCardSection tests.
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
import { PDFAudienceMetricIconCities } from '@/js/components/pdf-export/pdf-icons';
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import {
	renderPDFChildStyles,
	renderPDFStyle,
} from '@/js/components/pdf-export/test-utils';
import PDFAudienceCardSection from './PDFAudienceCardSection';

describe( 'PDFAudienceCardSection', () => {
	it( 'should fill its grid cell with a divider below', () => {
		expect(
			renderPDFStyle(
				<PDFAudienceCardSection Icon={ PDFAudienceMetricIconCities } />
			)
		).toMatchObject( {
			flexGrow: 1,
			borderBottomWidth: scalePDFValue( 1 ),
		} );
	} );

	it( 'should drop the divider when it is the last section', () => {
		expect(
			renderPDFStyle(
				<PDFAudienceCardSection
					Icon={ PDFAudienceMetricIconCities }
					isLast
				/>
			)
		).toMatchObject( { borderBottomWidth: 0 } );
	} );

	it( 'should center the icon on the section content, like the dashboard tile', () => {
		const [ content ] = renderPDFChildStyles(
			<PDFAudienceCardSection Icon={ PDFAudienceMetricIconCities } />
		);

		expect( content ).toMatchObject( {
			flexDirection: 'row',
			alignItems: 'center',
		} );
	} );
} );
