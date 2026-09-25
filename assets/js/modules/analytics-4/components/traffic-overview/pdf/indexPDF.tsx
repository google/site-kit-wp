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
import { __, sprintf } from '@wordpress/i18n';

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
import { AllTrafficPDFData, TrafficBreakdownRow } from './getPDFData';

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
} );

/**
 * Maps a breakdown's rows to `PDFMetricTileTable` rows.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} rows Ranked `{ label, percentage }` rows.
 * @return {Array<Object>} Rows of `{ primary, metric }`, with no change badge.
 */
function toTableRows( rows: TrafficBreakdownRow[] ) {
	return rows.map( ( { label, percentage } ) => ( {
		primary: label,
		metric: numFmt( percentage, {
			style: 'percent',
			maximumFractionDigits: 0,
		} ),
	} ) );
}

const TrafficOverviewPDF: FC< PDFWidgetComponentProps > = ( {
	data,
	chartImages,
} ) => {
	const trafficData = data as AllTrafficPDFData[ 'data' ] | undefined;
	const trafficChartImages =
		chartImages as AllTrafficPDFData[ 'chartImages' ];

	// Without data the widget returns null, and no placeholder takes its place.
	if ( ! trafficData ) {
		return null;
	}

	const {
		totalsReport,
		graphReport,
		channelBreakdown,
		locationBreakdown,
		deviceBreakdown,
	} = trafficData;

	const [ current, previous ] = totalsReport?.totals || [];
	const currentValue = Number( current?.metricValues?.[ 0 ]?.value ) || 0;
	const previousValue = Number( previous?.metricValues?.[ 0 ]?.value ) || 0;

	const { change, changeType } = getPDFTileChange(
		previousValue,
		currentValue
	);

	const graphRowCount = graphReport?.rows?.length || 0;
	const comparisonLabel =
		graphRowCount > 0
			? sprintf(
					/* translators: %d: number of days in the comparison period */
					__( 'Vs. prev. %d days', 'google-site-kit' ),
					graphRowCount
			  )
			: undefined;

	const formattedValue = numFmt( currentValue || 0 );

	const lineChartImage = trafficChartImages?.lineChart;

	const breakdownRowsByID: Record< string, TrafficBreakdownRow[] | null > = {
		channels: channelBreakdown,
		locations: locationBreakdown,
		devices: deviceBreakdown,
	};

	return (
		<View>
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Your site traffic over time', 'google-site-kit' ) }
			</PDFTypography>
			<PDFCard>
				<PDFMetricTile
					title={ __( 'All visitors', 'google-site-kit' ) }
					value={ formattedValue }
					change={ change }
					changeType={ changeType }
					changeLabel={ comparisonLabel }
				/>
				{ lineChartImage && (
					<Image src={ lineChartImage } style={ styles.chart } />
				) }
			</PDFCard>
			<View style={ styles.breakdowns }>
				{ TRAFFIC_BREAKDOWN_COLUMNS.map( ( { id, heading } ) => {
					const rows = breakdownRowsByID[ id ];

					return (
						<View key={ id } style={ styles.breakdownCard }>
							{ rows && rows.length > 0 ? (
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
		</View>
	);
};

export default TrafficOverviewPDF;
