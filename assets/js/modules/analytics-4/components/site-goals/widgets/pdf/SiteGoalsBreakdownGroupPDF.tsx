/**
 * Site Goals breakdown group PDF component.
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
import getPDFTileChange from '@/js/components/pdf-export/getPDFTileChange';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import { PDF_CHANGE_COLORS } from '@/js/components/pdf-export/shared-react-pdf-components/PDFChangeBadge';
import PDFMetricTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTile';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PERCENT_FORMAT } from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { numFmt } from '@/js/util';
import { SiteGoalsPDFGroup, SiteGoalsPDFMetric } from './shapeSiteGoalsPDFData';

const styles = createPDFStyles( {
	container: {
		flexDirection: 'column',
	},
	label: {
		marginBottom: 12,
	},
	tiles: {
		flexDirection: 'row',
	},
	// The flex slot each tile occupies in the row: the rate tile directly, or
	// the connector + content pair for the other two.
	tile: {
		flex: 1,
	},
	// Every tile's own content box gets this padding, matching the dashboard's
	// `.googlesitekit-site-goals-tile` padding for all three tile kinds.
	tileContent: {
		paddingVertical: 14,
		paddingHorizontal: 18,
	},
	// The rate tile is tinted by its own direction and drops the connector the
	// other tiles carry, matching `.googlesitekit-site-goals-tile--primary__*`
	// on the dashboard.
	primaryTile: {
		borderRadius: 8,
	},
	connectedTile: {
		flexDirection: 'row',
	},
	connector: {
		width: 1,
		backgroundColor: PDF_COLORS.SURFACES_SURFACE_1,
		marginRight: 16,
	},
} );

/**
 * Formats a metric's change for the tile badge.
 *
 * @since n.e.x.t
 *
 * @param metric Metric to compare, or `undefined` when the tile has no change.
 * @return Formatted change and its direction, empty when there is nothing to compare.
 */
function getChange( metric: SiteGoalsPDFMetric | undefined ) {
	if ( ! metric ) {
		return {};
	}

	return getPDFTileChange( metric.previous, metric.current );
}

/**
 * Builds the "of N total sessions" caption shown under a rate.
 *
 * @since n.e.x.t
 *
 * @param sessions Sessions metric, or `undefined` when sessions are unknown.
 * @return Caption, or `undefined` when there are no sessions to report.
 */
function getSessionsSubtitle(
	sessions: SiteGoalsPDFMetric | undefined
): string | undefined {
	if ( ! sessions ) {
		return undefined;
	}

	return sprintf(
		/* translators: %s: Number of sessions the rate is calculated over. */
		__( 'of %s total sessions', 'google-site-kit' ),
		numFmt( sessions.current )
	);
}

export interface SiteGoalsBreakdownGroupPDFProps {
	/** The group to render. */
	group: SiteGoalsPDFGroup;
	/** Title for the rate tile, e.g. "Sales Rate". */
	rateLabel: string;
	/** Title for the total tile, e.g. "Total Sales". */
	totalLabel: string;
	/** Caption under the total, e.g. "“purchase” events". */
	totalSubtitle?: string;
	/** Caption under each change badge, e.g. "Vs. prev. 28 days". */
	comparisonLabel?: string;
	/**
	 * Whether to render the group heading. The aggregated fallback renders a
	 * single group under the widget's own title, so it hides this.
	 */
	showLabel?: boolean;
}

const SiteGoalsBreakdownGroupPDF: FC< SiteGoalsBreakdownGroupPDFProps > = ( {
	group,
	rateLabel,
	totalLabel,
	totalSubtitle,
	comparisonLabel,
	showLabel = true,
} ) => {
	const { label, rate, total, engagementRate, sessions } = group;

	const sessionsSubtitle = getSessionsSubtitle( sessions );
	const rateChange = getChange( rate );

	return (
		<View style={ styles.container }>
			{ !! showLabel && !! label && (
				<PDFTypography type="title" style={ styles.label }>
					{ label }
				</PDFTypography>
			) }
			<View style={ styles.tiles }>
				{ !! rate && (
					<View
						style={ [
							styles.tile,
							styles.tileContent,
							styles.primaryTile,
							{
								backgroundColor:
									PDF_CHANGE_COLORS[
										rateChange.changeType ?? 'noChange'
									].backgroundColor,
							},
						] }
					>
						<PDFMetricTile
							title={ rateLabel }
							value={
								numFmt( rate.current, PERCENT_FORMAT ) as string
							}
							valueSize="small"
							subtitle={ sessionsSubtitle }
							changeLabel={ comparisonLabel }
							{ ...rateChange }
						/>
					</View>
				) }
				<View style={ [ styles.tile, styles.connectedTile ] }>
					{ !! rate && <View style={ styles.connector } /> }
					<View style={ [ styles.tile, styles.tileContent ] }>
						<PDFMetricTile
							title={ totalLabel }
							value={ numFmt( total.current ) as string }
							valueSize="small"
							subtitle={ totalSubtitle }
							changeLabel={ comparisonLabel }
							{ ...getChange( total ) }
						/>
					</View>
				</View>
				{ !! engagementRate && (
					<View style={ [ styles.tile, styles.connectedTile ] }>
						<View style={ styles.connector } />
						<View style={ [ styles.tile, styles.tileContent ] }>
							<PDFMetricTile
								title={ __(
									'Engagement rate',
									'google-site-kit'
								) }
								value={
									numFmt(
										engagementRate.current,
										PERCENT_FORMAT
									) as string
								}
								valueSize="small"
								subtitle={ sessionsSubtitle }
								changeLabel={ comparisonLabel }
								{ ...getChange( engagementRate ) }
							/>
						</View>
					</View>
				) }
			</View>
		</View>
	);
};

export default SiteGoalsBreakdownGroupPDF;
