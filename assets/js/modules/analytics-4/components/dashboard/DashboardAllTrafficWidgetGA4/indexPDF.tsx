/**
 * DashboardAllTrafficWidgetGA4 PDF component for @react-pdf/renderer.
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
import { StyleSheet, Text, View } from '@react-pdf/renderer';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PDFMetricTile from '@/js/components/PDFExport/components/PDFMetricTile';
import { calculateChange, numFmt } from '@/js/util';
import type { AllTrafficPDFData } from './getPDFData';

const styles = StyleSheet.create( {
	chartPlaceholder: {
		width: '100%',
		height: 200,
		backgroundColor: '#f5f5f5',
		marginTop: 12,
	},
	noData: {
		fontSize: 9,
		color: '#646464',
	},
} );

export interface DashboardAllTrafficWidgetGA4PDFProps {
	data?: AllTrafficPDFData[ 'data' ];
}

export default function DashboardAllTrafficWidgetGA4PDF( {
	data,
}: DashboardAllTrafficWidgetGA4PDFProps ) {
	if ( ! data ) {
		return (
			<View>
				<Text style={ styles.noData }>
					{ __( 'No data available.', 'google-site-kit' ) }
				</Text>
			</View>
		);
	}

	const { totalsReport, graphReport } = data;
	const [ current, previous ] = totalsReport?.totals || [];
	const currentValue = Number( current?.metricValues?.[ 0 ]?.value );
	const previousValue = Number( previous?.metricValues?.[ 0 ]?.value );

	const change = calculateChange( previousValue, currentValue );
	const changeData =
		typeof change === 'number'
			? {
					change: numFmt( Math.abs( change ), {
						style: 'percent',
						maximumFractionDigits: 1,
					} ),
					changeDirection: ( change >= 0 ? 'up' : 'down' ) as
						| 'up'
						| 'down',
			  }
			: undefined;

	const graphRowCount = graphReport?.rows?.length || 0;
	const comparisonLabel =
		graphRowCount > 0
			? sprintf(
					/* translators: %d: number of days */
					__( 'compared to the previous %d days', 'google-site-kit' ),
					graphRowCount
			  )
			: undefined;

	const formattedValue = numFmt( currentValue || 0 );

	return (
		<View>
			<PDFMetricTile
				title={ __( 'All Visitors', 'google-site-kit' ) }
				value={ formattedValue }
				changeLabel={ comparisonLabel }
				{ ...( changeData || {} ) }
			/>
			<View style={ styles.chartPlaceholder } />
		</View>
	);
}
