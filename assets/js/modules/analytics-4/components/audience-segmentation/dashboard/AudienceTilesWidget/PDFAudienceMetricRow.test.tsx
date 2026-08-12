/**
 * PDFAudienceMetricRow tests.
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
import { PDFAudienceMetricIconVisitors } from '@/js/components/pdf-export/pdf-icons';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import type { AudienceTileMetric } from './buildPDFAudienceCard';
import PDFAudienceMetricRow from './PDFAudienceMetricRow';

/**
 * Renders `PDFAudienceMetricRow` as a JSON tree string.
 *
 * @since 1.184.0
 *
 * @param metric The metric's current and previous value.
 * @return The rendered tree as a string.
 */
function renderRow( metric: AudienceTileMetric ) {
	return JSON.stringify(
		TestRenderer.create(
			<PDFAudienceMetricRow
				Icon={ PDFAudienceMetricIconVisitors }
				label="Visitors"
				value="24,200"
				metric={ metric }
			/>
		).toJSON()
	);
}

describe( 'PDFAudienceMetricRow', () => {
	it( 'renders the value and label', () => {
		const json = renderRow( { current: 24200, previous: 22000 } );

		expect( json ).toContain( '24,200' );
		expect( json ).toContain( 'Visitors' );
	} );

	it( 'shows a green chip when the metric rises', () => {
		const json = renderRow( { current: 24200, previous: 22000 } );

		expect( json ).toContain( '+10%' );
		expect( json ).toContain( PDF_COLORS.GREEN_G_50 );
	} );

	it( 'shows a red chip when the metric falls', () => {
		const json = renderRow( { current: 2, previous: 2.5 } );

		expect( json ).toContain( '-20%' );
		expect( json ).toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
	} );

	it( 'hides the chip when the previous value is zero', () => {
		const json = renderRow( { current: 100, previous: 0 } );

		expect( json ).not.toContain( PDF_COLORS.GREEN_G_50 );
		expect( json ).not.toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
	} );
} );
