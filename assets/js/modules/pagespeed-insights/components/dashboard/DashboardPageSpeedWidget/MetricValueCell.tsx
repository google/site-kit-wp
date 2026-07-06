/**
 * DashboardPageSpeedWidget PDF MetricValueCell component.
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import {
	FieldMetric,
	ScoredMetric,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import {
	CATEGORY_FAST,
	CATEGORY_SLOW,
} from '@/js/modules/pagespeed-insights/util/constants';

/**
 * The header cells and the value cells share this width, so the two strategy
 * columns line up down the card.
 */
export const STRATEGY_COLUMN_WIDTH = 253;

const SCORE_BADGE_COLORS = {
	fast: {
		background: PDF_COLORS.GREEN_G_50,
		text: PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER,
	},
	average: {
		background: PDF_COLORS.YELLOW_Y_50,
		text: PDF_COLORS.YELLOW_Y_500,
	},
	slow: {
		background: PDF_COLORS.UTILITY_ERROR_CONTAINER,
		text: PDF_COLORS.UTILITY_ON_ERROR_CONTAINER,
	},
} as const;

const styles = createPDFStyles( {
	valueCell: {
		width: STRATEGY_COLUMN_WIDTH,
		alignItems: 'flex-start',
	},
	badge: {
		marginTop: 6,
		borderRadius: 100,
		paddingVertical: 3,
		paddingHorizontal: 10,
	},
} );

/**
 * Maps a score category to the pill's colors. Fast maps to the green pair,
 * slow to the red pair, and any other category to the yellow pair.
 *
 * @since n.e.x.t
 *
 * @param category The metric's score category from the report.
 * @return The pill's background and text colors.
 */
function getBadgeColors( category: string ) {
	switch ( category ) {
		case CATEGORY_FAST:
			return SCORE_BADGE_COLORS.fast;
		case CATEGORY_SLOW:
			return SCORE_BADGE_COLORS.slow;
		default:
			return SCORE_BADGE_COLORS.average;
	}
}

/**
 * Maps a score category to the pill's translated label. Fast reads "Good",
 * slow reads "Poor", and any other category reads "Needs improvement".
 *
 * @since n.e.x.t
 *
 * @param category The metric's score category from the report.
 * @return The pill's translated label.
 */
function getCategoryLabel( category: string ): string {
	switch ( category ) {
		case CATEGORY_FAST:
			return __( 'Good', 'google-site-kit' );
		case CATEGORY_SLOW:
			return __( 'Poor', 'google-site-kit' );
		default:
			return __( 'Needs improvement', 'google-site-kit' );
	}
}

interface MetricValueCellProps {
	/** The metric shown in the cell. Without one, the cell renders empty. */
	metric: ScoredMetric | FieldMetric | null | undefined;
}

export default function MetricValueCell( { metric }: MetricValueCellProps ) {
	if ( ! metric ) {
		// A missing metric renders an empty cell. The fixed width keeps the
		// other strategy's column in place.
		return <View style={ styles.valueCell } />;
	}
	const badgeColors = getBadgeColors( metric.category );
	return (
		<View style={ styles.valueCell }>
			<PDFTypography type="title">{ metric.displayValue }</PDFTypography>
			<View
				style={ [
					styles.badge,
					{ backgroundColor: badgeColors.background },
				] }
			>
				<PDFTypography
					type="label"
					size="small"
					style={ { color: badgeColors.text } }
				>
					{ getCategoryLabel( metric.category ) }
				</PDFTypography>
			</View>
		</View>
	);
}
