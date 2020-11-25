/**
 * AdSenseDashboardWidgetOverview component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { isUndefined } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { Cell, Grid, Row } from '../../../../material-components';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/data-block';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import getNoDataComponent from '../../../../components/notifications/nodata';
import { readableLargeNumber, changeToPercent, numberFormat } from '../../../../util';
import { isZeroReport } from '../../util';
const { useSelect } = Data;

export default function AdSenseDashboardWidgetOverview( { metrics, selectedStats, handleStatSelection } ) {
	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { compare: true } ) );

	const currentRangeArgs = {
		metrics: Object.keys( metrics ),
		startDate,
		endDate,
	};

	const prevRangeArgs = {
		metrics: Object.keys( metrics ),
		startDate: compareStartDate,
		endDate: compareEndDate,
	};

	const currentRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( currentRangeArgs ) );
	const prevRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( prevRangeArgs ) );

	const resolvedCurrentData = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ currentRangeArgs ] ) );
	const resolvedPreviousData = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ prevRangeArgs ] ) );

	const currentError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ) );
	const previousError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ prevRangeArgs ] ) );

	if ( ! resolvedCurrentData || ! resolvedPreviousData ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( currentError || previousError ) {
		const error = currentError || previousError;
		return getDataErrorComponent( 'adsense', error.message, false, false, false, error );
	}

	if ( isZeroReport( currentRangeData ) ) {
		return getNoDataComponent( _x( 'AdSense', 'Service name', 'google-site-kit' ), true, true, true );
	}

	const { totals, headers } = currentRangeData;
	const { totals: prevTotals } = prevRangeData;

	return (
		<Grid>
			<Row>
				<Cell alignTop smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 0 }
						className="googlesitekit-data-block--page-rpm googlesitekit-data-block--button-1"
						title={ metrics[ headers[ 0 ].name ] }
						datapoint={ readableLargeNumber( totals[ 0 ], headers[ 0 ]?.currency ) }
						change={ ! isUndefined( prevTotals ) ? changeToPercent( prevTotals[ 0 ], totals[ 0 ] ) : 0 }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 0 }
						handleStatSelection={ handleStatSelection.bind( null, 0 ) }
					/>
				</Cell>

				<Cell alignTop smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 1 }
						className="googlesitekit-data-block--page-rpm googlesitekit-data-block--button-2"
						title={ metrics[ headers[ 1 ].name ] }
						datapoint={ readableLargeNumber( totals[ 1 ], headers[ 1 ]?.currency ) }
						change={ ! isUndefined( prevTotals ) ? changeToPercent( prevTotals[ 1 ], totals[ 1 ] ) : 0 }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 1 }
						handleStatSelection={ handleStatSelection.bind( null, 1 ) }
					/>
				</Cell>

				<Cell alignTop smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 2 }
						className="googlesitekit-data-block--impression googlesitekit-data-block--button-3"
						title={ metrics[ headers[ 2 ].name ] }
						datapoint={ readableLargeNumber( totals[ 2 ] ) }
						change={ ! isUndefined( prevTotals ) ? changeToPercent( prevTotals[ 2 ], totals[ 2 ] ) : 0 }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 2 }
						handleStatSelection={ handleStatSelection.bind( null, 2 ) }
					/>
				</Cell>

				<Cell alignTop smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 3 }
						className="googlesitekit-data-block--impression googlesitekit-data-block--button-4"
						title={ metrics[ headers[ 3 ].name ] }
						datapoint={ sprintf(
							/* translators: %s: percentage value. */
							_x( ' %1$s%%', 'AdSense performance Page CTA percentage', 'google-site-kit' ),
							numberFormat( totals[ 3 ] * 100, { maximumFractionDigits: 2 } )
						) }
						change={ ! isUndefined( prevTotals ) ? changeToPercent( prevTotals[ 3 ], totals[ 3 ] ) : 0 }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 3 }
						handleStatSelection={ handleStatSelection.bind( null, 3 ) }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

AdSenseDashboardWidgetOverview.propTypes = {
	metrics: PropTypes.shape( {} ).isRequired,
	selectedStats: PropTypes.number.isRequired,
	handleStatSelection: PropTypes.func.isRequired,
};
