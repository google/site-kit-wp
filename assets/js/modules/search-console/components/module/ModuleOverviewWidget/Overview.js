/**
 * Overview component for ModuleOverviewWidget.
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
 * External dependencies
 */
import each from 'lodash/each';
import round from 'lodash/round';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { calculateChange } from '../../../../../util';
import { Grid, Row, Cell } from '../../../../../material-components';
import DataBlock from '../../../../../components/DataBlock';

const reduceSearchConsoleData = ( rows ) => {
	const dataMap = [
		[
			{ type: 'string', label: __( 'Day', 'google-site-kit' ) },
			{ type: 'number', label: __( 'Clicks', 'google-site-kit' ) },
			{ type: 'number', label: __( 'Impressions', 'google-site-kit' ) },
			{ type: 'number', label: __( 'CTR', 'google-site-kit' ) },
			{ type: 'number', label: __( 'Position', 'google-site-kit' ) },
		],
	];

	let totalClicks = 0;
	let totalImpressions = 0;
	let totalCTR = 0;
	let totalPosition = 0;
	const count = rows.length;

	each( rows, ( row ) => {
		const date = new Date( row.keys[ 0 ] );
		dataMap.push( [
			( date.getMonth() + 1 ) + '/' + date.getUTCDate(),
			row.clicks,
			row.impressions,
			round( row.ctr, 3 ),
			round( row.position, 3 ),
		] );
		totalClicks += row.clicks;
		totalImpressions += row.impressions;
		totalCTR += row.ctr;
		totalPosition += row.position;
	} );

	// Do not divide by zero.
	const averageCTR = count > 0 ? totalCTR / count : 0.0;
	const averagePosition = count > 0 ? totalPosition / count : 0.0;

	return {
		dataMap,
		totalClicks,
		totalImpressions,
		averageCTR,
		averagePosition,
	};
};

const extractSearchConsoleDashboardData = ( rows ) => {
	// Split the results in two chunks.
	const half = Math.floor( rows.length / 2 );
	// Rows are from oldest to newest.
	const latestData = reduceSearchConsoleData( rows.slice( half ) );
	const olderData = reduceSearchConsoleData( rows.slice( 0, half ) );

	return {
		dataMap: latestData.dataMap,
		totalClicks: latestData.totalClicks,
		totalImpressions: latestData.totalImpressions,
		averageCTR: latestData.averageCTR,
		averagePosition: latestData.averagePosition,
		totalClicksChange: calculateChange( olderData.totalClicks, latestData.totalClicks ),
		totalImpressionsChange: calculateChange( olderData.totalImpressions, latestData.totalImpressions ),
		averageCTRChange: calculateChange( olderData.averageCTR, latestData.averageCTR ),
		averagePositionChange: calculateChange( olderData.averagePosition, latestData.averagePosition ),
	};
};

const Overview = ( { data, selectedStats, handleStatsSelection } ) => {
	const {
		totalClicks,
		totalImpressions,
		averageCTR,
		averagePosition,
		totalClicksChange,
		totalImpressionsChange,
		averageCTRChange,
		averagePositionChange,
	} = extractSearchConsoleDashboardData( data );

	const cellProps = {
		smSize: 2,
		mdSize: 2,
		lgSize: 3,
	};

	return (
		<Grid>
			<Row>
				<Cell { ...cellProps }>
					<DataBlock
						stat={ 0 }
						className="googlesitekit-data-block--clicks googlesitekit-data-block--button-1"
						title={ __( 'Total Clicks', 'google-site-kit' ) }
						datapoint={ totalClicks }
						change={ totalClicksChange }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 0 }
						handleStatSelection={ handleStatsSelection }
					/>
				</Cell>

				<Cell { ...cellProps }>
					<DataBlock
						stat={ 1 }
						className="googlesitekit-data-block--impressions googlesitekit-data-block--button-2"
						title={ __( 'Total Impressions', 'google-site-kit' ) }
						datapoint={ totalImpressions }
						change={ totalImpressionsChange }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 1 }
						handleStatSelection={ handleStatsSelection }
					/>
				</Cell>

				<Cell { ...cellProps }>
					<DataBlock
						stat={ 2 }
						className="googlesitekit-data-block--position googlesitekit-data-block--button-3"
						title={ __( 'Average CTR', 'google-site-kit' ) }
						datapoint={ averageCTR }
						datapointUnit="%"
						change={ averageCTRChange }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 2 }
						handleStatSelection={ handleStatsSelection }
					/>
				</Cell>

				<Cell { ...cellProps }>
					<DataBlock
						stat={ 3 }
						className="googlesitekit-data-block--ctr googlesitekit-data-block--button-4"
						title={ __( 'Average Position', 'google-site-kit' ) }
						datapoint={ averagePosition }
						change={ averagePositionChange }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 3 }
						handleStatSelection={ handleStatsSelection }
					/>
				</Cell>
			</Row>
		</Grid>
	);
};

Overview.propTypes = {
	data: PropTypes.arrayOf( PropTypes.object ),
	selectedStats: PropTypes.number.isRequired,
	handleStatsSelection: PropTypes.func.isRequired,
};

export default Overview;
