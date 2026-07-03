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
import { Text, View } from '@react-pdf/renderer';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDF_SCORE_BADGE_COLORS } from '@/js/components/pdf-export/pdf-theme';
import type {
	FieldMetric,
	ScoredMetric,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import {
	CATEGORY_FAST,
	CATEGORY_SLOW,
} from '@/js/modules/pagespeed-insights/util/constants';
import { styles } from './pdfStyles';

function getBadgeColors( category: string ) {
	switch ( category ) {
		case CATEGORY_FAST:
			return PDF_SCORE_BADGE_COLORS.fast;
		case CATEGORY_SLOW:
			return PDF_SCORE_BADGE_COLORS.slow;
		default:
			return PDF_SCORE_BADGE_COLORS.average;
	}
}

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
	metric: ScoredMetric | FieldMetric | null | undefined;
}

export default function MetricValueCell( { metric }: MetricValueCellProps ) {
	if ( ! metric ) {
		return (
			<View style={ styles.valueCell }>
				<Text style={ styles.unavailableCell }>—</Text>
			</View>
		);
	}
	const badgeColors = getBadgeColors( metric.category );
	return (
		<View style={ styles.valueCell }>
			<Text style={ styles.metricValue }>{ metric.displayValue }</Text>
			<View
				style={ [
					styles.badge,
					{ backgroundColor: badgeColors.background },
				] }
			>
				<Text
					style={ [ styles.badgeText, { color: badgeColors.text } ] }
				>
					{ getCategoryLabel( metric.category ) }
				</Text>
			</View>
		</View>
	);
}
