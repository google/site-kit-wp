/**
 * LeadGenerationPerformanceWidgetPDF tests.
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
import { renderPDFText } from '@/js/components/pdf-export/test-utils';
import LeadGenerationPerformanceWidgetPDF from './LeadGenerationPerformanceWidgetPDF';
import { LEAD_GENERATION_PDF_GROUPS } from './pdf/__fixtures__';

/**
 * Renders the Lead generation performance PDF section and reads the text it holds.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} leadEvents The lead events the Key action tiles count.
 * @return {string} The text the Lead generation performance section renders, joined in render order.
 */
function renderLeadGenerationSectionText( leadEvents: string[] ): string {
	return renderPDFText(
		<LeadGenerationPerformanceWidgetPDF
			data={ {
				groups: LEAD_GENERATION_PDF_GROUPS,
				dateRangeLength: 28,
				leadEvents,
			} }
		/>
	).join( ' ' );
}

describe( 'LeadGenerationPerformanceWidgetPDF', () => {
	it( 'titles the tiles "Form completion rate" and "Total form completions", and quotes the single detected lead event', () => {
		const text = renderLeadGenerationSectionText( [ 'contact' ] );

		expect( text ).toContain( 'Lead generation performance' );
		expect( text ).toContain( '“Contact” form' );
		expect( text ).toContain( 'Form completion rate' );
		expect( text ).toContain( 'Total form completions' );
		expect( text ).toContain( '“contact” events' );
	} );

	it( 'counts the event types behind the Key action total when several lead events are detected', () => {
		const text = renderLeadGenerationSectionText( [
			'contact',
			'generate_lead',
		] );

		expect( text ).toContain( '2 event types' );
	} );

	it( 'renders nothing when the Lead generation loader returns no data', () => {
		expect(
			TestRenderer.create(
				<LeadGenerationPerformanceWidgetPDF data={ null } />
			).toJSON()
		).toBeNull();
	} );
} );
