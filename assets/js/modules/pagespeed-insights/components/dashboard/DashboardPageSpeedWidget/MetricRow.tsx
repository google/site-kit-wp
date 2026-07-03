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
import { Text, View } from '@react-pdf/renderer';

/**
 * Internal dependencies
 */
import type {
	FieldMetric,
	ScoredMetric,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import MetricValueCell from './MetricValueCell';
import { styles } from './pdfStyles';

interface MetricRowProps {
	title: string;
	description: string;
	mobileMetric: ScoredMetric | FieldMetric | null | undefined;
	desktopMetric: ScoredMetric | FieldMetric | null | undefined;
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
				<Text style={ styles.metricTitle }>{ title }</Text>
				<Text style={ styles.metricDescription }>{ description }</Text>
			</View>
			<MetricValueCell metric={ mobileMetric } />
			<MetricValueCell metric={ desktopMetric } />
		</View>
	);
}
