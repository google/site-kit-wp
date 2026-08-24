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
import getPDFTileChange, {
	getPDFChangeType,
} from '@/js/components/pdf-export/getPDFTileChange';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFMetricTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTile';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFChangeType } from '@/js/components/pdf-export/types';
import { PERCENT_FORMAT } from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { numFmt } from '@/js/util';
import { SiteGoalsPDFGroup, SiteGoalsPDFMetric } from './shapeSiteGoalsPDFData';
import SiteGoalsTileConnectorPDF from './SiteGoalsTileConnectorPDF';

const styles = createPDFStyles( {
	container: {
		flexDirection: 'column',
	},
	label: {
		marginBottom: 18,
		marginTop: 2,
	},
	tiles: {
		flexDirection: 'row',
		gap: 42,
	},
	tile: {
		flexBasis: 0,
		flexGrow: 1,
		minWidth: 0,
	},
	tileContent: {
		paddingVertical: 20.5,
	},
	primaryTile: {
		paddingHorizontal: 18,
	},
	connectedTile: {
		flexDirection: 'row',
	},
} );

/** The background color behind the Site Goals rate tile, one per change type. */
const RATE_PANEL_COLOR_BY_CHANGE_TYPE: Record< PDFChangeType, string > = {
	positive: PDF_COLORS.GREEN_G_10,
	negative: PDF_COLORS.RED_R_10,
	noChange: PDF_COLORS.NEUTRAL_N_10,
};

/**
 * Formats a metric's change for the tile badge.
 *
 * @since n.e.x.t
 *
 * @param {(Object|undefined)} metric The Site Goals PDF metric to compare, or `undefined` when the tile has none.
 * @return {Object} Formatted change and its direction, empty when there is nothing to compare.
 */
function getChange( metric: SiteGoalsPDFMetric | undefined ) {
	// A previous value of zero leaves nothing to compare against, so the tile
	// shows no change badge. The dashboard's `Tile` does the same. We check for
	// zero here because `calculateChange` reads zero to zero as no change.
	if ( ! metric || metric.previous === 0 ) {
		return {};
	}

	return getPDFTileChange( metric.previous, metric.current );
}

/**
 * Picks the background color behind the Site Goals rate tile.
 *
 * The color follows the direction the rate moved, matching the dashboard's
 * `Tile`. A rate that rose from zero takes the green panel, even though the
 * tile shows no change badge.
 *
 * @since n.e.x.t
 *
 * @param {(Object|undefined)} rate The Key action rate for the current and the previous period, or `undefined` when the tile has none.
 * @return {(string|undefined)} The background color behind the rate tile, or `undefined` when the rate is zero in both periods.
 */
function getRatePanelColor(
	rate: SiteGoalsPDFMetric | undefined
): string | undefined {
	if ( ! rate || ( rate.current === 0 && rate.previous === 0 ) ) {
		return undefined;
	}

	return RATE_PANEL_COLOR_BY_CHANGE_TYPE[
		getPDFChangeType( rate.current - rate.previous )
	];
}

/**
 * Builds the change props for one Site Goals PDF metric tile.
 *
 * `PDFMetricTile` renders its caption whenever `changeLabel` is set, and its
 * badge only when there is a change. So we pass `changeLabel` only alongside
 * a change, and the tile shows the badge and the caption together, or
 * neither.
 *
 * @since n.e.x.t
 *
 * @param {(Object|undefined)} metric          The Site Goals PDF metric to compare, or `undefined` when the tile has none.
 * @param {(string|undefined)} comparisonLabel The caption under the badge, such as "Vs. prev. 28 days".
 * @return {Object} The change and its direction, with the caption when the tile shows a badge.
 */
function getTileChangeProps(
	metric: SiteGoalsPDFMetric | undefined,
	comparisonLabel: string | undefined
) {
	const tileChange = getChange( metric );

	if ( ! tileChange.change ) {
		return tileChange;
	}

	return { ...tileChange, changeLabel: comparisonLabel };
}

/**
 * Builds the "of N total sessions" caption shown under a rate.
 *
 * @since n.e.x.t
 *
 * @param {(Object|undefined)} sessions The sessions metric, or `undefined` when the group has none.
 * @return {(string|undefined)} The caption, or `undefined` when the group has no sessions.
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
	/** Title for the rate tile, e.g. "Sales rate". */
	rateLabel: string;
	/** Title for the total tile, e.g. "Total sales". */
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

	return (
		<View style={ styles.container }>
			{ !! showLabel && !! label && (
				<PDFTypography type="title" size="large" style={ styles.label }>
					{ label }
				</PDFTypography>
			) }
			<View style={ styles.tiles }>
				{ !! rate && (
					<View
						style={ [
							styles.tile,
							{ backgroundColor: getRatePanelColor( rate ) },
						] }
					>
						<View
							style={ [ styles.tileContent, styles.primaryTile ] }
						>
							<PDFMetricTile
								title={ rateLabel }
								value={
									numFmt(
										rate.current,
										PERCENT_FORMAT
									) as string
								}
								valueSize="small"
								subtitle={ sessionsSubtitle }
								{ ...getTileChangeProps(
									rate,
									comparisonLabel
								) }
							/>
						</View>
					</View>
				) }
				<View style={ [ styles.tile, styles.connectedTile ] }>
					{ !! rate && <SiteGoalsTileConnectorPDF /> }
					<View style={ [ styles.tile, styles.tileContent ] }>
						<PDFMetricTile
							title={ totalLabel }
							value={ numFmt( total.current ) as string }
							valueSize="small"
							subtitle={ totalSubtitle }
							{ ...getTileChangeProps( total, comparisonLabel ) }
						/>
					</View>
				</View>
				{ !! engagementRate && (
					<View style={ [ styles.tile, styles.connectedTile ] }>
						<SiteGoalsTileConnectorPDF />
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
								{ ...getTileChangeProps(
									engagementRate,
									comparisonLabel
								) }
							/>
						</View>
					</View>
				) }
			</View>
		</View>
	);
};

export default SiteGoalsBreakdownGroupPDF;
