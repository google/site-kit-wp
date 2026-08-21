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
import { findTextStrings } from '@/js/components/pdf-export/test-utils';
import { LeadGenerationPerformancePDFData } from './getLeadGenerationPerformancePDFData';
import LeadGenerationPerformanceWidgetPDF from './LeadGenerationPerformanceWidgetPDF';

const LEAD_GENERATION_GROUPS = [
	{
		id: '12',
		label: '“Contact” form',
		total: { current: 40, previous: 30 },
		rate: { current: 0.2, previous: 0.2 },
		engagementRate: { current: 0.4, previous: 0.3 },
		sessions: { current: 200, previous: 150 },
	},
];

/**
 * Renders the Lead generation performance PDF section and reads the text it holds.
 *
 * @since n.e.x.t
 *
 * @param {Object} data The loaded Lead generation performance section data, or `null` when its loader returned none.
 * @return {Array<string>} The text strings the Lead generation performance section renders, in order.
 */
function renderLeadGenerationSectionText(
	data: LeadGenerationPerformancePDFData[ 'data' ]
) {
	const tree = TestRenderer.create(
		<LeadGenerationPerformanceWidgetPDF data={ data } />
	).toJSON();

	if ( ! tree || Array.isArray( tree ) ) {
		return [];
	}

	return findTextStrings( tree );
}

/**
 * Builds the Lead generation performance section data for a set of lead events.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} leadEvents The lead events the Key action tiles count.
 * @return {Object} The Lead generation performance section data.
 */
function buildLeadGenerationSectionData( leadEvents: string[] ) {
	return { groups: LEAD_GENERATION_GROUPS, dateRangeLength: 28, leadEvents };
}

describe( 'LeadGenerationPerformanceWidgetPDF', () => {
	it( 'names the form tiles and the one lead event behind the Key action total', () => {
		const text = renderLeadGenerationSectionText(
			buildLeadGenerationSectionData( [ 'contact' ] )
		).join( ' ' );

		expect( text ).toContain( 'Lead generation performance' );
		expect( text ).toContain( '“Contact” form' );
		expect( text ).toContain( 'Form completion rate' );
		expect( text ).toContain( 'Total form completions' );
		expect( text ).toContain( '“contact” events' );
	} );

	it( 'counts the event types behind the Key action total when several lead events are detected', () => {
		const text = renderLeadGenerationSectionText(
			buildLeadGenerationSectionData( [ 'contact', 'generate_lead' ] )
		).join( ' ' );

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
