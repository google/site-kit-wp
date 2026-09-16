/**
 * Audience card for the Your visitor groups PDF widget.
 *
 * `PDFYourVisitorGroups` renders one card per configured GA4 audience.
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
import {
	PDFAudienceMetricIconCities,
	PDFAudienceMetricIconPagesPerVisit,
	PDFAudienceMetricIconPageviews,
	PDFAudienceMetricIconTopContent,
	PDFAudienceMetricIconVisitors,
	PDFAudienceMetricIconVisitsPerVisitor,
} from '@/js/components/pdf-export/pdf-icons';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import PDFLink from '@/js/components/pdf-export/shared-react-pdf-components/PDFLink';
import PDFPartialDataBadge from '@/js/components/pdf-export/shared-react-pdf-components/PDFPartialDataBadge';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { numFmt } from '@/js/util';
import type {
	AudienceTilePDFData,
	AudienceTileTopCity,
	AudienceTileTopContent,
} from './buildPDFAudienceCard';
import PDFAudienceMetricRow from './PDFAudienceMetricRow';

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
	// A row that keeps a title on the left and its Partial data badge on the
	// right, both vertically centered, like the dashboard tile.
	badgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	// Each section is inset from the card edges and draws a divider below it.
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
	cityName: {
		// A long city name truncates to one line with an ellipsis. `@react-pdf`
		// wraps text by default, so `maxLines` caps it at one line.
		maxLines: 1,
		textOverflow: 'ellipsis',
	},
	cityPercentage: {
		marginTop: 2,
	},
	contentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	// The title fills the row remainder before the pageviews count.
	contentTitle: {
		flex: 1,
		marginRight: 30,
	},
	// A long title truncates to one line with an ellipsis. `@react-pdf`
	// wraps text by default, so `maxLines` caps it at one line.
	contentTitleText: {
		maxLines: 1,
		textOverflow: 'ellipsis',
	},
} );

interface PDFYourVisitorGroupsTileProps {
	/** The audience display name, shown in the card header. */
	audienceName: string;
	/** The four period-over-period metrics. */
	metrics: AudienceTilePDFData[ 'metrics' ];
	/** Up to three top cities. */
	topCities: AudienceTileTopCity[];
	/** Up to three top content pages. */
	topContent: AudienceTileTopContent[];
	/** Whether to show the Partial data badge beside the audience name. */
	isAudiencePartialData: boolean;
	/** Whether to show the Partial data badge on the Top content title. */
	isTopContentPartialData: boolean;
}

const PDFYourVisitorGroupsTile: FC< PDFYourVisitorGroupsTileProps > = ( {
	audienceName,
	metrics,
	topCities,
	topContent,
	isAudiencePartialData,
	isTopContentPartialData,
} ) => {
	const metricRows = [
		{
			Icon: PDFAudienceMetricIconVisitors,
			label: __( 'Visitors', 'google-site-kit' ),
			value: numFmt( metrics.visitors.current ),
			metric: metrics.visitors,
		},
		{
			Icon: PDFAudienceMetricIconVisitsPerVisitor,
			label: __( 'Visits per visitor', 'google-site-kit' ),
			value: numFmt( metrics.visitsPerVisitor.current ),
			metric: metrics.visitsPerVisitor,
		},
		{
			Icon: PDFAudienceMetricIconPagesPerVisit,
			label: __( 'Pages per visit', 'google-site-kit' ),
			value: numFmt( metrics.pagesPerVisit.current, {
				style: 'decimal',
				maximumFractionDigits: 2,
			} ),
			metric: metrics.pagesPerVisit,
		},
		{
			Icon: PDFAudienceMetricIconPageviews,
			label: sprintf(
				/* translators: %s: a percentage value such as "33.3%". */
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
			<View style={ [ styles.header, styles.badgeRow ] }>
				<PDFTypography type="title" size="small">
					{ audienceName }
				</PDFTypography>
				{ isAudiencePartialData && <PDFPartialDataBadge /> }
			</View>

			{ metricRows.map( ( row ) => (
				<PDFAudienceMetricRow
					key={ row.label }
					Icon={ row.Icon }
					label={ row.label }
					value={ row.value }
					metric={ row.metric }
				/>
			) ) }

			<View style={ styles.row }>
				<View style={ styles.iconColumn }>
					<PDFAudienceMetricIconCities />
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
								<PDFTypography
									type="title"
									size="small"
									style={ styles.cityName }
								>
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
					<PDFAudienceMetricIconTopContent />
				</View>
				<View style={ styles.body }>
					<View style={ [ styles.badgeRow ] }>
						<PDFTypography
							size="medium"
							style={ [
								styles.sectionTitle,
								styles.topContentTitle,
							] }
						>
							{ __(
								'Top content by pageviews',
								'google-site-kit'
							) }
						</PDFTypography>
						{ isTopContentPartialData && <PDFPartialDataBadge /> }
					</View>
					{ /* If no content exists, show a "no data" message. */ }
					{ ! topContent.length && (
						<PDFTypography size="small">
							{ __( 'No data to show yet', 'google-site-kit' ) }
						</PDFTypography>
					) }
					{ /*
					 * The page title links to its Analytics report, like the
					 * dashboard tile. When the page has no link, `PDFLink`
					 * renders the title as plain text instead of as a link.
					 */ }
					{ topContent.map( ( content ) => (
						<View key={ content.title } style={ styles.contentRow }>
							<View style={ styles.contentTitle }>
								<PDFLink
									href={ content.serviceURL }
									size="small"
									style={ styles.contentTitleText }
								>
									{ content.title }
								</PDFLink>
							</View>
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

export default PDFYourVisitorGroupsTile;
