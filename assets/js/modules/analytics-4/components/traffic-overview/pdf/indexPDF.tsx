/**
 * Traffic Overview PDF component for @react-pdf/renderer.
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
import { Image, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import getPDFTileChange from '@/js/components/pdf-export/getPDFTileChange';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import PDFMetricTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTile';
import PDFMetricTileTable from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTileTable';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import { numFmt } from '@/js/util';
import { TrafficBreakdownRow, TrafficOverviewPDFData } from './getPDFData';
import TrafficOverviewKeyFactorsPDF from './TrafficOverviewKeyFactorsPDF';
import TrafficOverviewNoticePDF from './TrafficOverviewNoticePDF';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
	chart: {
		width: '100%',
		// Fit the line chart to the card width without stretching it.
		height: 133,
		objectFit: 'contain',
		marginTop: 7,
	},
	breakdowns: {
		flexDirection: 'row',
		alignItems: 'stretch',
		marginTop: 24,
		gap: 24,
	},
	breakdownCard: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
	// Matches `PDFMetricTileTable`'s own card, so a breakdown's empty state
	// holds the same space its ranked rows would.
	emptyCard: {
		minHeight: 150,
		flexGrow: 1,
	},
	emptyTitle: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
	emptyMessage: {
		marginTop: 12,
	},
	summaryNotice: {
		marginBottom: 16,
	},
	disclosure: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
		marginTop: 16,
	},
} );

/**
 * Capitalizes the first letter of each word, as CSS `text-transform: capitalize` does.
 *
 * @since 1.189.0
 *
 * @param {string} label A dimension value, such as `smart tv`.
 * @return {string} The label with each word capitalized, such as `Smart Tv`.
 */
function capitalizeWords( label: string ): string {
	return label.replace(
		/(^|\s)([^\s\w]*)(\w)/g,
		( match, space, punctuation, letter ) =>
			`${ space }${ punctuation }${ letter.toUpperCase() }`
	);
}

/**
 * Maps a breakdown's rows to `PDFMetricTileTable` rows.
 *
 * @since 1.189.0
 *
 * @param {Array<Object>} rows Ranked `{ label, formattedPercentage }` rows.
 * @return {Array<Object>} Rows of `{ primary, metric }`, with no change badge.
 */
function toTableRows( rows: TrafficBreakdownRow[] ) {
	return rows.map( ( { label, formattedPercentage } ) => ( {
		primary: label,
		metric: formattedPercentage,
	} ) );
}

const TrafficOverviewPDF: FC< PDFWidgetComponentProps > = ( {
	data,
	chartImages,
} ) => {
	const trafficData = data as TrafficOverviewPDFData[ 'data' ] | undefined;
	const trafficChartImages =
		chartImages as TrafficOverviewPDFData[ 'chartImages' ];

	// Without data the widget returns null, and no placeholder takes its place.
	if ( ! trafficData ) {
		return null;
	}

	const {
		totalVisits,
		uniqueVisitors,
		dailyTraffic,
		typicalTraffic,
		channelBreakdown,
		locationBreakdown,
		deviceBreakdown,
	} = trafficData;

	// No previous visits print no change, as on the dashboard.
	const { change, changeType } = getPDFTileChange(
		totalVisits.previous || 0,
		totalVisits.current
	);

	const dayCount = dailyTraffic.length;
	const comparisonLabel =
		dayCount > 0
			? sprintf(
					/* translators: %d: number of days in the comparison period */
					_n(
						'Vs. prev. %d day',
						'Vs. prev. %d days',
						dayCount,
						'google-site-kit'
					),
					dayCount
			  )
			: undefined;

	// The analysis compares the visits with their typical range, so it prints
	// only where the chart draws the band, and the band's waiting text in its
	// place, as on the dashboard.
	const summaryNotice =
		typicalTraffic?.analysis || typicalTraffic?.bandNotice;
	const hasGeneratedText =
		!! typicalTraffic?.analysis || !! typicalTraffic?.driver;

	const lineChartImage = trafficChartImages?.lineChart;

	const breakdownRowsByID: Record< string, TrafficBreakdownRow[] > = {
		channels: channelBreakdown,
		locations: locationBreakdown,
		// The dashboard's devices column capitalizes GA4's lowercase device
		// names, so the PDF prints them the same way.
		devices: deviceBreakdown.map( ( row ) => ( {
			...row,
			label: capitalizeWords( row.label ),
		} ) ),
	};

	return (
		<View>
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Your site traffic over time', 'google-site-kit' ) }
			</PDFTypography>
			<PDFCard>
				{ !! summaryNotice && (
					<TrafficOverviewNoticePDF
						text={ summaryNotice }
						style={ styles.summaryNotice }
					/>
				) }
				<PDFMetricTile
					title={ __( 'Total visits', 'google-site-kit' ) }
					value={ numFmt( totalVisits.current ) }
					subtitle={ sprintf(
						/* translators: %s: the number of people who visited the site, counting each person once, such as "1.2K" */
						_n(
							'%s unique visitor',
							'%s unique visitors',
							uniqueVisitors,
							'google-site-kit'
						),
						numFmt( uniqueVisitors )
					) }
					change={ change }
					changeType={ changeType }
					changeLabel={ change ? comparisonLabel : undefined }
				/>
				{ lineChartImage && (
					<Image src={ lineChartImage } style={ styles.chart } />
				) }
			</PDFCard>
			{ typicalTraffic && (
				<TrafficOverviewKeyFactorsPDF { ...typicalTraffic } />
			) }
			<View style={ styles.breakdowns }>
				{ TRAFFIC_BREAKDOWN_COLUMNS.map( ( { id, heading } ) => {
					const rows = breakdownRowsByID[ id ];

					return (
						<View key={ id } style={ styles.breakdownCard }>
							{ rows.length > 0 ? (
								<PDFMetricTileTable
									title={ heading }
									rows={ toTableRows( rows ) }
								/>
							) : (
								<PDFCard style={ styles.emptyCard }>
									<PDFTypography
										type="body"
										size="small"
										style={ styles.emptyTitle }
									>
										{ heading }
									</PDFTypography>
									<PDFTypography
										type="body"
										size="small"
										style={ styles.emptyMessage }
									>
										{ __(
											'No data to display: your site hasn’t received any visitors yet',
											'google-site-kit'
										) }
									</PDFTypography>
								</PDFCard>
							) }
						</View>
					);
				} ) }
			</View>
			{ hasGeneratedText && (
				<PDFTypography size="small" style={ styles.disclosure }>
					{ __(
						'Some insights in this report are created using AI and may contain mistakes.',
						'google-site-kit'
					) }
				</PDFTypography>
			) }
		</View>
	);
};

export default TrafficOverviewPDF;
