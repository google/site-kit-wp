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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, Row, Cell } from '../../../../../material-components';
import { extractSearchConsoleDashboardData } from '../../../util';
import DataBlock from '../../../../../components/DataBlock';

const Overview = ( { data, selectedStats, handleStatsSelection, dateRangeLength } ) => {
	const {
		totalClicks,
		totalImpressions,
		averageCTR,
		averagePosition,
		totalClicksChange,
		totalImpressionsChange,
		averageCTRChange,
		averagePositionChange,
	} = extractSearchConsoleDashboardData( data, dateRangeLength );

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
