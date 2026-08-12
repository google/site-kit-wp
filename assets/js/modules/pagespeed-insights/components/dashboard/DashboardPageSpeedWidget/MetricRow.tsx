/**
 * DashboardPageSpeedWidget PDF MetricRow component.
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
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import {
	FieldMetric,
	ScoredMetric,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import MetricValueCell from './MetricValueCell';

const styles = createPDFStyles( {
	metricRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: 24,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
	metricRowLast: {
		borderBottomWidth: 0,
	},
	metricLabelGroup: {
		flex: 1,
	},
	metricDescription: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
		marginTop: 6,
	},
} );

interface MetricRowProps {
	/** The metric's name, like "Total Blocking Time". */
	title: string;
	/** The line under the title that says what the metric measures. */
	description: string;
	/** The metric's mobile value. Without one, the Mobile cell renders empty. */
	mobileMetric: ScoredMetric | FieldMetric | null | undefined;
	/** The metric's desktop value. Without one, the Desktop cell renders empty. */
	desktopMetric: ScoredMetric | FieldMetric | null | undefined;
	/** Whether this row is the section's last, which renders no bottom divider. */
	isLast?: boolean;
}

export default function MetricRow( {
	title,
	description,
	mobileMetric,
	desktopMetric,
	isLast,
}: MetricRowProps ) {
	return (
		<View
			style={
				isLast
					? [ styles.metricRow, styles.metricRowLast ]
					: styles.metricRow
			}
		>
			<View style={ styles.metricLabelGroup }>
				<PDFTypography type="title">{ title }</PDFTypography>
				<PDFTypography size="small" style={ styles.metricDescription }>
					{ description }
				</PDFTypography>
			</View>
			<MetricValueCell metric={ mobileMetric } />
			<MetricValueCell metric={ desktopMetric } />
		</View>
	);
}
