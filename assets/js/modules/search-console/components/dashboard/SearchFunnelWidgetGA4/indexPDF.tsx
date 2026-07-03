/**
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFMetricChartTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricChartTile';
import { numFmt } from '@/js/util';
import type { SearchFunnelMetric, SearchFunnelPDFData } from './getPDFData';

const styles = createPDFStyles( {
	heading: {
		fontSize: 16,
		color: '#161b18',
		marginTop: 24,
		marginBottom: 16,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	cell: {
		width: '48.5%',
		marginBottom: 24,
	},
	noData: {
		fontSize: 12,
		color: '#646464',
	},
} );

interface CardDefinition {
	key: 'impressions' | 'clicks' | 'uniqueVisitors' | 'keyEvents';
	title: string;
	currentLabel: string;
	color: string;
}

// The cards render in the 2x2 grid in this order.
const CARDS: CardDefinition[] = [
	{
		key: 'impressions',
		title: __( 'Total impressions', 'google-site-kit' ),
		currentLabel: __( 'Impressions', 'google-site-kit' ),
		color: '#6380b8',
	},
	{
		key: 'clicks',
		title: __( 'Total clicks', 'google-site-kit' ),
		currentLabel: __( 'Clicks', 'google-site-kit' ),
		color: '#4bbbbb',
	},
	{
		key: 'uniqueVisitors',
		title: __( 'Unique visitors from Search', 'google-site-kit' ),
		currentLabel: __( 'Unique visitors', 'google-site-kit' ),
		color: '#3c7251',
	},
	{
		key: 'keyEvents',
		title: __( 'Key events', 'google-site-kit' ),
		currentLabel: __( 'Key events', 'google-site-kit' ),
		color: '#8e68cb',
	},
];

/**
 * Derives the change chip props from a metric's period-over-period change ratio.
 *
 * @since n.e.x.t
 *
 * @param {?Object} metric The metric data, if any.
 * @return {Object} Props for the change chip (empty when the change is unavailable).
 */
function getChangeProps( metric: SearchFunnelMetric | null ): {
	change?: string;
	changeDirection?: 'up' | 'down';
} {
	const change = metric?.change;

	if ( typeof change !== 'number' ) {
		return {};
	}

	return {
		change: numFmt( Math.abs( change ), {
			style: 'percent',
			maximumFractionDigits: 1,
		} ),
		changeDirection: change >= 0 ? 'up' : 'down',
	};
}

export interface SearchFunnelWidgetGA4PDFProps {
	data?: SearchFunnelPDFData[ 'data' ];
	chartImages?: SearchFunnelPDFData[ 'chartImages' ];
}

const SearchFunnelWidgetGA4PDF: FC< SearchFunnelWidgetGA4PDFProps > = ( {
	data,
	chartImages,
} ) => {
	if ( ! data ) {
		return (
			<View>
				<Text style={ styles.heading }>
					{ __( 'Search traffic over time', 'google-site-kit' ) }
				</Text>
				<Text style={ styles.noData }>
					{ __( 'Data unavailable', 'google-site-kit' ) }
				</Text>
			</View>
		);
	}

	const { dateRangeLength, metrics } = data;

	const changeLabel = sprintf(
		/* translators: %d: number of days in the comparison period */
		__( 'Vs. prev. %d days', 'google-site-kit' ),
		dateRangeLength
	);

	return (
		<View>
			{ /* This widget shares the Traffic area with the All Visitors widget,
			     so it renders its own sub-section heading. */ }
			<Text style={ styles.heading }>
				{ __( 'Search traffic over time', 'google-site-kit' ) }
			</Text>
			<View style={ styles.grid }>
				{ CARDS.map( ( { key, title, currentLabel, color } ) => {
					const metric = metrics[ key ];
					const chartImage = chartImages?.[ key ] ?? null;

					return (
						<View key={ key } style={ styles.cell }>
							<PDFMetricChartTile
								title={ title }
								value={ numFmt( metric?.total || 0 ) }
								changeLabel={ changeLabel }
								currentLabel={ currentLabel }
								color={ color }
								chartImage={ chartImage }
								{ ...getChangeProps( metric ) }
							/>
						</View>
					);
				} ) }
			</View>
		</View>
	);
};

export default SearchFunnelWidgetGA4PDF;
