/**
 * Audience card for the Your visitor groups PDF widget.
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
import { View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import PDFChangeBadge from '@/js/components/pdf-export/shared-react-pdf-components/PDFChangeBadge';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFIcon } from '@/js/components/pdf-export/types';
import { calculateChange, numFmt } from '@/js/util';
import {
	AudienceMetricCitiesIcon,
	AudienceMetricPagesPerVisitIcon,
	AudienceMetricPageviewsIcon,
	AudienceMetricTopContentIcon,
	AudienceMetricVisitorsIcon,
	AudienceMetricVisitsPerVisitorIcon,
} from './audienceMetricPDFIcons';
import type {
	AudienceTileMetric,
	AudienceTilePDFData,
	AudienceTileTopCity,
	AudienceTileTopContent,
} from './getPDFData';

const styles = createPDFStyles( {
	// The dashboard tile gives the card no padding, so the header sets its own
	// inset and its bottom divider reaches both card edges.
	card: {
		paddingVertical: 0,
		paddingHorizontal: 0,
	},
	// The header holds the audience name and a full-width bottom divider. The
	// divider sits on the header's full-width box, so it meets both card edges
	// while the name stays inset.
	header: {
		paddingVertical: 25,
		paddingHorizontal: 25,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
	// Each metric row and each section is inset from the card edges and draws a
	// divider below it.
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 24,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
	// The last row drops its divider, so the card ends on content.
	lastRow: {
		borderBottomWidth: 0,
	},
	iconColumn: {
		width: 52,
		alignItems: 'center',
		marginRight: 4,
	},
	body: {
		flex: 1,
	},
	metricValue: {
		lineHeight: 32 / 28,
	},
	metricLabel: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
	sectionTitle: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
	topContentTitle: {
		marginBottom: 10,
	},
	citiesRow: {
		flexDirection: 'row',
		marginTop: 12,
	},
	city: {
		flex: 1,
	},
	cityPercentage: {
		marginTop: 2,
	},
	contentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginVertical: 6,
	},
	contentLink: {
		flex: 1,
		color: PDF_COLORS.CONTENT_SECONDARY,
		marginRight: 30,
		// A long title truncates to one line with an ellipsis. `@react-pdf`
		// wraps text by default, so `maxLines` caps it at one line.
		maxLines: 1,
		textOverflow: 'ellipsis',
	},
} );

/**
 * Builds the delta chip's props from a metric's period-over-period change.
 *
 * It matches the dashboard's `ChangeBadge`: no chip when the change can't be
 * calculated, and a sign on every non-zero value.
 *
 * @since n.e.x.t
 *
 * @param metric The metric with its current and previous value.
 * @return Props for the change chip, or `null` to hide it.
 */
function getChangeChip(
	metric: AudienceTileMetric
): { change: string; isNegative: boolean } | null {
	const change = calculateChange( metric.previous, metric.current );

	if ( change === null ) {
		return null;
	}

	return {
		change: numFmt( change, {
			style: 'percent',
			signDisplay: 'exceptZero',
			maximumFractionDigits: 1,
		} ),
		isNegative: change < 0,
	};
}

interface MetricRowProps {
	/** The metric's icon. */
	Icon: PDFIcon;
	/** The metric's label, shown below the value. */
	label: string;
	/** The pre-formatted metric value. */
	value: string;
	/** The metric's current and previous value, for the delta chip. */
	metric: AudienceTileMetric;
}

const MetricRow: FC< MetricRowProps > = ( { Icon, label, value, metric } ) => {
	const chip = getChangeChip( metric );

	return (
		<View style={ styles.row }>
			<View style={ styles.iconColumn }>
				<Icon />
			</View>
			<View style={ styles.body }>
				<PDFTypography
					type="headline"
					size="medium"
					style={ styles.metricValue }
				>
					{ value }
				</PDFTypography>
				<PDFTypography size="medium" style={ styles.metricLabel }>
					{ label }
				</PDFTypography>
			</View>
			{ chip && (
				<PDFChangeBadge
					change={ chip.change }
					isNegative={ chip.isNegative }
				/>
			) }
		</View>
	);
};

interface PDFAudienceTileProps {
	/** The audience display name, shown in the card header. */
	audienceName: string;
	/** The four period-over-period metrics. */
	metrics: AudienceTilePDFData[ 'metrics' ];
	/** Up to three top cities. */
	topCities: AudienceTileTopCity[];
	/** Up to three top content pages. */
	topContent: AudienceTileTopContent[];
}

const PDFAudienceTile: FC< PDFAudienceTileProps > = ( {
	audienceName,
	metrics,
	topCities,
	topContent,
} ) => {
	const metricRows = [
		{
			Icon: AudienceMetricVisitorsIcon,
			label: __( 'Visitors', 'google-site-kit' ),
			value: numFmt( metrics.visitors.current ),
			metric: metrics.visitors,
		},
		{
			Icon: AudienceMetricVisitsPerVisitorIcon,
			label: __( 'Visits per visitor', 'google-site-kit' ),
			value: numFmt( metrics.visitsPerVisitor.current ),
			metric: metrics.visitsPerVisitor,
		},
		{
			Icon: AudienceMetricPagesPerVisitIcon,
			label: __( 'Pages per visit', 'google-site-kit' ),
			value: numFmt( metrics.pagesPerVisit.current, {
				style: 'decimal',
				maximumFractionDigits: 2,
			} ),
			metric: metrics.pagesPerVisit,
		},
		{
			Icon: AudienceMetricPageviewsIcon,
			label: sprintf(
				/* translators: %s: a percentage value such as 33.3%. */
				__( '%s of total pageviews', 'google-site-kit' ),
				numFmt( metrics.pageviews.percentageOfTotalPageViews, {
					style: 'percent',
					maximumFractionDigits: 1,
				} )
			),
			value: numFmt( metrics.pageviews.current ),
			metric: metrics.pageviews,
		},
	];

	return (
		<PDFCard style={ styles.card }>
			<View style={ styles.header }>
				<PDFTypography type="title" size="small">
					{ audienceName }
				</PDFTypography>
			</View>

			{ metricRows.map( ( row ) => (
				<MetricRow
					key={ row.label }
					Icon={ row.Icon }
					label={ row.label }
					value={ row.value }
					metric={ row.metric }
				/>
			) ) }

			<View style={ styles.row }>
				<View style={ styles.iconColumn }>
					<AudienceMetricCitiesIcon />
				</View>
				<View style={ styles.body }>
					<PDFTypography size="medium" style={ styles.sectionTitle }>
						{ __(
							'Cities with the most visitors',
							'google-site-kit'
						) }
					</PDFTypography>
					<View style={ styles.citiesRow }>
						{ topCities.map( ( city ) => (
							<View key={ city.name } style={ styles.city }>
								<PDFTypography type="title" size="small">
									{ city.name }
								</PDFTypography>
								<PDFTypography
									size="medium"
									style={ styles.cityPercentage }
								>
									{ numFmt( city.percentage, {
										style: 'percent',
										maximumFractionDigits: 1,
									} ) }
								</PDFTypography>
							</View>
						) ) }
					</View>
				</View>
			</View>

			<View style={ [ styles.row, styles.lastRow ] }>
				<View style={ styles.iconColumn }>
					<AudienceMetricTopContentIcon />
				</View>
				<View style={ styles.body }>
					<PDFTypography
						size="medium"
						style={ [
							styles.sectionTitle,
							styles.topContentTitle,
						] }
					>
						{ __( 'Top content by pageviews', 'google-site-kit' ) }
					</PDFTypography>
					{ topContent.map( ( content ) => (
						<View key={ content.title } style={ styles.contentRow }>
							<PDFTypography
								size="small"
								style={ styles.contentLink }
							>
								{ content.title }
							</PDFTypography>
							<PDFTypography size="small">
								{ numFmt( content.pageviews ) }
							</PDFTypography>
						</View>
					) ) }
				</View>
			</View>
		</PDFCard>
	);
};

export default PDFAudienceTile;
