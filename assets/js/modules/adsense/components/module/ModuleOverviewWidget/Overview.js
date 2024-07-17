/**
 * ModuleOverviewWidget component.
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
 * Internal dependencies
 */
import { Grid, Cell } from '../../../../../material-components';
import { calculateChange } from '../../../../../util';
import DataBlock from '../../../../../components/DataBlock';
import DataBlockGroup from '../../../../../components/DataBlockGroup';

function Overview( {
	metrics,
	currentRangeData,
	previousRangeData,
	selectedStats,
	handleStatsSelection,
} ) {
	const { totals, headers } = currentRangeData;
	const { totals: previousTotals } = previousRangeData;

	const cellProps = {
		smSize: 2,
		mdSize: 2,
		lgSize: 3,
	};

	return (
		<Grid>
			<DataBlockGroup className="mdc-layout-grid__inner">
				{ headers?.map( ( headerData, index ) => {
					let datapointUnit = null;
					if ( index === 0 || index === 1 ) {
						datapointUnit = headerData?.currencyCode;
					}
					if ( index === 3 ) {
						datapointUnit = '%';
					}
					return (
						<Cell
							key={ metrics[ headers[ index ].name ] }
							{ ...cellProps }
						>
							<DataBlock
								stat={ index }
								className={ `googlesitekit-data-block--${
									index === 3 ? 'impression' : 'page-rpm'
								} googlesitekit-data-block--button-${
									index + 1
								}` }
								title={ metrics[ headerData.name ] }
								datapoint={ totals?.cells[ index ].value || 0 }
								datapointUnit={ datapointUnit }
								change={ calculateChange(
									previousTotals?.cells[ index ].value || 0,
									totals?.cells[ index ].value || 0
								) }
								changeDataUnit="%"
								context="button"
								selected={ selectedStats === index }
								handleStatSelection={ handleStatsSelection }
							/>
						</Cell>
					);
				} ) }
			</DataBlockGroup>
		</Grid>
	);
}

Overview.propTypes = {
	metrics: PropTypes.object,
	currentRangeData: PropTypes.object,
	previousRangeData: PropTypes.object,
	selectedStats: PropTypes.number.isRequired,
	handleStatsSelection: PropTypes.func.isRequired,
};

export default Overview;
