/**
 * Typical Traffic Overview PDF component tests.
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
import {
	flattenPDFStyle,
	renderPDFText,
} from '@/js/components/pdf-export/test-utils';
import { getPlaceholderDailyTraffic } from '@/js/modules/analytics-4/components/traffic-overview/charts/placeholderTrafficChartData';
import { createBreakdownValues } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { getTypicalBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { TrafficOverviewTypicalTrafficPDFData } from './getTypicalTrafficPDFData';
import TypicalTrafficOverviewPDF from './TypicalTrafficOverviewPDF';

const LINE_CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';

function buildReports( {
	currentVisits,
	previousVisits,
}: {
	currentVisits: number;
	previousVisits: number;
} ) {
	return {
		totalVisits: { current: currentVisits, previous: previousVisits },
		uniqueVisitors: 870,
		// 28 days, which the "Vs. prev. 28 days" label counts.
		dailyTraffic: getPlaceholderDailyTraffic( '2025-01-08', '2025-02-04' ),
		channelBreakdown: [
			{
				label: 'Organic Search',
				percentage: 0.792,
				formattedPercentage: '79%',
			},
			{ label: 'Direct', percentage: 0.133, formattedPercentage: '13%' },
		],
		locationBreakdown: [
			{
				label: 'Singapore',
				percentage: 0.228,
				formattedPercentage: '23%',
			},
			{ label: 'Others', percentage: 0.156, formattedPercentage: '16%' },
		],
		deviceBreakdown: [
			{ label: 'Desktop', percentage: 0.584, formattedPercentage: '58%' },
			{ label: 'Mobile', percentage: 0.416, formattedPercentage: '42%' },
		],
	};
}

function renderTree(
	props: ComponentProps< typeof TypicalTrafficOverviewPDF >
) {
	const renderer = TestRenderer.create(
		<TypicalTrafficOverviewPDF { ...props } />
	);
	return renderer.toJSON();
}

/** The reports most tests render against; only the sign-change test varies `previousVisits`. */
const DEFAULT_REPORTS = buildReports( {
	currentVisits: 1234,
	previousVisits: 1000,
} );

/** A typical traffic view with every part, and the generated insight. */
const TYPICAL_TRAFFIC: TrafficOverviewTypicalTrafficPDFData = {
	daysInRange: 28,
	analysis:
		'Over the last 28 days, your site had **1,234** visits, about 12% above what is usual for it.',
	availabilityNotice: null,
	keyFactorsAvailable: true,
	driver: 'Visits rose 12% (+134 visits), led by **Referral** (+365 visits).',
	keyFactorsNotice: null,
	keyFactors: [
		{ name: 'Referral', change: 365 },
		{ name: 'Organic Search', change: -21 },
	],
};

describe( 'Typical Traffic Overview PDF', () => {
	it( 'renders nothing when data is null', () => {
		expect( renderTree( { data: null } ) ).toBeNull();
	} );

	it( 'renders nothing when data is undefined', () => {
		expect( renderTree( {} ) ).toBeNull();
	} );

	it( 'renders the heading and the Total visits tile with its value, change, unique visitors and line chart', () => {
		const json = JSON.stringify(
			renderTree( {
				data: DEFAULT_REPORTS,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		expect( json ).toContain( 'Your site traffic over time' );
		expect( json ).toContain( 'Total visits' );
		expect( json ).not.toContain( 'All visitors' );
		// `numFmt` shortens large totals, the same as the dashboard widget.
		expect( json ).toContain( '1.2K' );
		expect( json ).toContain( '+23.4%' );
		expect( json ).toContain( 'Vs. prev. 28 days' );
		expect( json ).toContain( '870 unique visitors' );
		expect( json ).toContain( LINE_CHART_DATA_URI );
	} );

	it( 'names a single day and a single unique visitor in the singular', () => {
		const texts = renderPDFText(
			<TypicalTrafficOverviewPDF
				data={ {
					...DEFAULT_REPORTS,
					uniqueVisitors: 1,
					dailyTraffic: getPlaceholderDailyTraffic(
						'2025-02-04',
						'2025-02-04'
					),
				} }
			/>
		);

		expect( texts ).toContain( 'Vs. prev. 1 day' );
		expect( texts ).toContain( '1 unique visitor' );
	} );

	it( 'renders the Total visits tile without a chart when the chart image is missing', () => {
		const json = JSON.stringify( renderTree( { data: DEFAULT_REPORTS } ) );

		expect( json ).toContain( 'Total visits' );
		expect( json ).not.toContain( 'data:image' );
	} );

	it( 'prints no change badge, and no comparison label on its own, when the previous value is 0', () => {
		const data = buildReports( {
			currentVisits: 1234,
			previousVisits: 0,
		} );

		const json = JSON.stringify(
			renderTree( {
				data,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		// Neither the positive nor the negative badge fill renders.
		expect( json ).not.toContain( '#d8ffc0' );
		expect( json ).not.toContain( '#ffded3' );
		expect( json ).not.toContain( 'Vs. prev.' );
	} );

	it( 'renders the three ranked tiles, in order, with their headings and rows', () => {
		const json = JSON.stringify(
			renderTree( {
				data: DEFAULT_REPORTS,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		const channelsIndex = json.indexOf( 'Visits by channels' );
		const locationsIndex = json.indexOf( 'Visits by locations' );
		const devicesIndex = json.indexOf( 'Visits by devices' );

		expect( channelsIndex ).toBeGreaterThan( -1 );
		expect( locationsIndex ).toBeGreaterThan( channelsIndex );
		expect( devicesIndex ).toBeGreaterThan( locationsIndex );

		// Each row's label and formatted share are printed.
		expect( json ).toContain( 'Organic Search' );
		expect( json ).toContain( '79%' );
		expect( json ).toContain( 'Singapore' );
		expect( json ).toContain( '23%' );
		expect( json ).toContain( 'Desktop' );
		expect( json ).toContain( '58%' );
		expect( json ).toContain( 'Others' );
	} );

	it( 'prints each row beside its share from `getTypicalBreakdownRows()`, including "<1%"', () => {
		const data = {
			...DEFAULT_REPORTS,
			channelBreakdown: getTypicalBreakdownRows(
				createBreakdownValues( [
					[ 'Direct', 4630 ],
					[ 'Organic Search', 3040 ],
					[ 'Organic Social', 1560 ],
					[ 'Referral', 730 ],
					[ 'Paid Search', 25 ],
					[ 'Email', 15 ],
				] )
			),
		};

		const texts = renderPDFText(
			<TypicalTrafficOverviewPDF data={ data } />
		);
		const channelsIndex = texts.indexOf( 'Visits by channels' );

		// The rows are shaped by the same `getTypicalBreakdownRows()` the dashboard
		// columns use, and each label is followed by its share.
		expect( texts.slice( channelsIndex + 1, channelsIndex + 11 ) ).toEqual(
			[
				'Direct',
				'46%',
				'Organic Search',
				'31%',
				'Organic Social',
				'16%',
				'Referral',
				'7%',
				'Others',
				'<1%',
			]
		);
		expect( texts ).not.toContain( '0%' );
	} );

	it( 'prints device names capitalized, as the dashboard shows them, and leaves the other labels as GA4 returned them', () => {
		const data = {
			...DEFAULT_REPORTS,
			channelBreakdown: getTypicalBreakdownRows(
				createBreakdownValues( [
					[ 'Direct', 90 ],
					[ '(not set)', 10 ],
				] )
			),
			deviceBreakdown: getTypicalBreakdownRows(
				createBreakdownValues( [
					[ 'desktop', 60 ],
					[ 'smart tv', 30 ],
					[ '(not set)', 10 ],
				] )
			),
		};

		const texts = renderPDFText(
			<TypicalTrafficOverviewPDF data={ data } />
		);
		const channelsIndex = texts.indexOf( 'Visits by channels' );
		const devicesIndex = texts.indexOf( 'Visits by devices' );

		expect( texts.slice( channelsIndex + 1, channelsIndex + 5 ) ).toEqual( [
			'Direct',
			'90%',
			'(not set)',
			'10%',
		] );
		expect( texts.slice( devicesIndex + 1, devicesIndex + 7 ) ).toEqual( [
			'Desktop',
			'60%',
			'Smart Tv',
			'30%',
			'(Not Set)',
			'10%',
		] );
	} );

	it( 'renders no change badge on the ranked tiles', () => {
		const json = JSON.stringify(
			renderTree( {
				data: DEFAULT_REPORTS,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		// The Total visits change is the only badge fill in the tree.
		const badgeCount = json.split( '#d8ffc0' ).length - 1;
		expect( badgeCount ).toBe( 1 );
	} );

	it( 'prints a breakdown’s heading and its empty state when it has no rows, while the other two still print their rows', () => {
		const data = { ...DEFAULT_REPORTS, channelBreakdown: [] };

		const json = JSON.stringify(
			renderTree( {
				data,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		expect( json ).toContain( 'Visits by channels' );
		expect( json ).toContain(
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect( json ).not.toContain( 'Organic Search' );

		expect( json ).toContain( 'Visits by locations' );
		expect( json ).toContain( 'Singapore' );
		expect( json ).toContain( 'Visits by devices' );
		expect( json ).toContain( 'Desktop' );
	} );
	it( 'prints neither the typical traffic view nor the AI disclosure without them', () => {
		const texts = renderPDFText(
			<TypicalTrafficOverviewPDF data={ DEFAULT_REPORTS } />
		);

		expect(
			texts.some( ( text ) =>
				text.startsWith( 'Biggest traffic shifts' )
			)
		).toBe( false );
		expect( texts.join( ' ' ) ).not.toContain( 'created using AI' );
	} );

	describe( 'with the typical traffic view', () => {
		it( 'prints the analysis above the visits, with the names it highlights in the medium weight', () => {
			const texts = renderPDFText(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: TYPICAL_TRAFFIC,
					} }
				/>
			);

			const analysisIndex = texts.indexOf(
				'Over the last 28 days, your site had '
			);

			expect( analysisIndex ).toBeGreaterThan( -1 );
			expect( texts[ analysisIndex + 1 ] ).toBe( '1,234' );
			expect( analysisIndex ).toBeLessThan(
				texts.indexOf( 'Total visits' )
			);

			const tree = TestRenderer.create(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: TYPICAL_TRAFFIC,
					} }
				/>
			);
			const highlight = tree.root.find(
				( node ) =>
					typeof node.type === 'string' &&
					node.children.length === 1 &&
					node.children[ 0 ] === '1,234'
			);

			expect( flattenPDFStyle( highlight.props.style ) ).toMatchObject( {
				fontWeight: 500,
			} );
			expect( JSON.stringify( tree.toJSON() ) ).not.toContain( '**' );
		} );

		it( 'prints the notice of what the range lacks in place of the analysis', () => {
			const texts = renderPDFText(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: {
							...TYPICAL_TRAFFIC,
							analysis: null,
							driver: null,
							availabilityNotice:
								'Select a date range of up to 364 days to see insights about your traffic.',
						},
					} }
				/>
			);

			expect(
				texts.indexOf(
					'Select a date range of up to 364 days to see insights about your traffic.'
				)
			).toBeLessThan( texts.indexOf( 'Total visits' ) );
		} );

		it( 'prints no key factors section for a range without key factors, with the notice of what they wait for in place of the analysis', () => {
			const notice =
				'We’re still learning what’s usual for your site. Check back on February 6, 2025 to see which channels changed the most, and on April 2, 2025 to see your typical traffic range.';
			const texts = renderPDFText(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: {
							...TYPICAL_TRAFFIC,
							analysis: null,
							driver: null,
							availabilityNotice: notice,
							keyFactorsAvailable: false,
							keyFactors: [],
						},
					} }
				/>
			);

			expect( texts.indexOf( notice ) ).toBeGreaterThan( -1 );
			expect( texts.indexOf( notice ) ).toBeLessThan(
				texts.indexOf( 'Total visits' )
			);
			expect( texts ).not.toContain(
				'Biggest traffic shifts vs. the previous 28 days'
			);
		} );

		it( 'prints the key factors’ heading, the driver, then each card with its change in visits, after the chart and before the breakdowns', () => {
			const texts = renderPDFText(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: TYPICAL_TRAFFIC,
					} }
				/>
			);

			const headingIndex = texts.indexOf(
				'Biggest traffic shifts vs. the previous 28 days'
			);

			expect( headingIndex ).toBeGreaterThan(
				texts.indexOf( 'Total visits' )
			);
			expect( texts.slice( headingIndex + 1 ) ).toEqual(
				expect.arrayContaining( [ 'Referral', '+365 visits' ] )
			);
			expect(
				texts.slice(
					headingIndex,
					texts.indexOf( 'Visits by channels' )
				)
			).toEqual( [
				'Biggest traffic shifts vs. the previous 28 days',
				'Visits rose 12% (+134 visits), led by ',
				'Referral',
				' (+365 visits).',
				'Referral',
				'+365 visits',
				'Organic Search',
				'-21 visits',
			] );
		} );

		it( 'prints the notice in place of the cards, and each card’s share of the visits on a steady period', () => {
			const texts = renderPDFText(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: {
							...TYPICAL_TRAFFIC,
							driver: null,
							keyFactorsNotice:
								'No channel changed notably compared with the previous 28 days',
							keyFactors: [
								{
									name: 'Organic Search',
									change: 4,
									shareText: '52.4% of all visits',
								},
							],
						},
					} }
				/>
			);

			const headingIndex = texts.indexOf(
				'Biggest traffic shifts vs. the previous 28 days'
			);

			expect(
				texts.slice(
					headingIndex,
					texts.indexOf( 'Visits by channels' )
				)
			).toEqual( [
				'Biggest traffic shifts vs. the previous 28 days',
				'No channel changed notably compared with the previous 28 days',
				'Organic Search',
				'+4 visits',
				'52.4% of all visits',
			] );
		} );

		it( 'prints the AI disclosure at the end while it prints a generated insight', () => {
			const texts = renderPDFText(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: TYPICAL_TRAFFIC,
					} }
				/>
			);

			expect( texts[ texts.length - 1 ] ).toBe(
				'Some insights in this report are created using AI and may contain mistakes.'
			);
		} );

		it( 'prints no AI disclosure without a generated insight', () => {
			const texts = renderPDFText(
				<TypicalTrafficOverviewPDF
					data={ {
						...DEFAULT_REPORTS,
						typicalTraffic: {
							...TYPICAL_TRAFFIC,
							analysis: null,
							driver: null,
						},
					} }
				/>
			);

			expect( texts.join( ' ' ) ).not.toContain( 'created using AI' );
		} );
	} );
} );
