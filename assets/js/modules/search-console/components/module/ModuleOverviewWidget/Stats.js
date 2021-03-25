/**
 * Stats component for ModuleOverviewWidget.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { decodeHTMLEntity } from '../../../../../util';
import { getSiteStatsDataForGoogleChart } from '../../../util';
import { Grid, Row, Cell } from '../../../../../material-components';
import PreviewBlock from '../../../../../components/PreviewBlock';
import GoogleChart from '../../../../../components/GoogleChart';
import Data from 'googlesitekit-data';
const { useSelect } = Data;

const Stats = ( { loading, data, selectedStats } ) => {
	const currentEntityTitle = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityTitle() );

	if ( loading ) {
		return (
			<PreviewBlock width="100%" height="270px" />
		);
	}

	const metrics = [
		{
			color: '#4285f4',
			label: __( 'Clicks', 'google-site-kit' ),
			metric: 'clicks',
		},
		{
			color: '#27bcd4',
			label: __( 'Impressions', 'google-site-kit' ),
			metric: 'impressions',
		},
		{
			color: '#1b9688',
			label: __( 'CTR', 'google-site-kit' ),
			metric: 'ctr',
		},
		{
			color: '#673ab7',
			label: __( 'Position', 'google-site-kit' ),
			metric: 'position',
		},
	];

	let title = __( 'Search Traffic Summary', 'google-site-kit' );
	if ( currentEntityTitle ) {
		/* translators: %s: page title */
		title = sprintf( __( 'Search Traffic Summary for %s', 'google-site-kit' ), decodeHTMLEntity( currentEntityTitle ) );
	}

	const options = {
		chart: {
			title,
		},
		curveType: 'line',
		height: 270,
		width: '100%',
		chartArea: {
			height: '77%',
			left: 60,
			width: '100%',
		},
		legend: {
			position: 'top',
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
		},
		hAxis: {
			format: 'M/d/yy',
			gridlines: {
				color: '#fff',
			},
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
		},
		vAxis: {
			direction: selectedStats === 3 ? -1 : 1,
			gridlines: {
				color: '#eee',
			},
			minorGridlines: {
				color: '#eee',
			},
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
			titleTextStyle: {
				color: '#616161',
				fontSize: 12,
				italic: false,
			},
		},
		series: {
			0: {
				color: metrics[ selectedStats ].color,
				targetAxisIndex: 0,
			},
			1: {
				color: metrics[ selectedStats ].color,
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
		tooltip: {
			isHtml: true, // eslint-disable-line sitekit/acronym-case
			trigger: 'both',
		},
		focusTarget: 'category',
	};

	// Split the data in two chunks.
	const half = Math.floor( data.length / 2 );
	const latestData = data.slice( half );
	const olderData = data.slice( 0, half );

	const googleChartData = getSiteStatsDataForGoogleChart(
		latestData,
		olderData,
		metrics[ selectedStats ].label,
		metrics[ selectedStats ].metric,
	);

	return (
		<Grid className="googlesitekit-search-console-site-stats">
			<Row>
				<Cell size={ 12 }>
					<GoogleChart
						chartType="line"
						selectedStats={ [ selectedStats ] }
						data={ googleChartData }
						options={ options }
					/>
				</Cell>
			</Row>
		</Grid>
	);
};

export default Stats;
