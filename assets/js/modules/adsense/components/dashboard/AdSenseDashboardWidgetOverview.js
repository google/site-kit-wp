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
import { __, _x, sprintf } from '@wordpress/i18n';

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
import { isDataZeroAdSense } from '../../util';
const { useSelect } = Data;

export default function AdSenseDashboardWidgetOverview( { selectedStats, handleStatSelection } ) {
	const {
		currentRangeData,
		prevRangeData,
		error,
		isLoading,
	} = useSelect( ( select ) => {
		const {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} = select( CORE_USER ).getDateRangeDates( { compare: true } );

		const metrics = [ 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS', 'PAGE_VIEWS_CTR' ];
		const currentRangeArgs = { metrics, startDate, endDate };
		const prevRangeArgs = {
			metrics,
			startDate: compareStartDate,
			endDate: compareEndDate,
		};

		return {
			currentRangeData: select( STORE_NAME ).getReport( currentRangeArgs ) || {},
			prevRangeData: select( STORE_NAME ).getReport( prevRangeArgs ) || {},

			error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ) ||
				select( STORE_NAME ).getErrorForSelector( 'getReport', [ prevRangeArgs ] ),

			isLoading: select( STORE_NAME ).isResolving( 'getReport', [ currentRangeArgs ] ) ||
				select( STORE_NAME ).isResolving( 'getReport', [ prevRangeArgs ] ),
		};
	} );

	if ( isLoading ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( error ) {
		return getDataErrorComponent( 'adsense', error.message, false, false, false, error );
	}

	// TODO: rework this to use the new isZeroReport function once https://github.com/google/site-kit-wp/issues/2242 is implemented
	const dataRequest = { data: { dateRange: 'last-28-days' } };
	if ( isDataZeroAdSense( currentRangeData, undefined, dataRequest ) ) {
		return getNoDataComponent( _x( 'AdSense', 'Service name', 'google-site-kit' ), true, true, true );
	}

	const { totals, headers } = currentRangeData;
	const { totals: prevTotals } = prevRangeData;

	return (
		<Grid>
			<Row>
				<Cell align="top" smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 0 }
						className="googlesitekit-data-block--page-rpm googlesitekit-data-block--button-1"
						title={ __( 'Earnings', 'google-site-kit' ) }
						datapoint={ readableLargeNumber( totals[ 0 ], headers[ 0 ]?.currency ) }
						change={ ! isUndefined( prevTotals ) ? changeToPercent( prevTotals[ 0 ], totals[ 0 ] ) : 0 }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 0 }
						handleStatSelection={ handleStatSelection.bind( null, 0 ) }
					/>
				</Cell>

				<Cell align="top" smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 1 }
						className="googlesitekit-data-block--page-rpm googlesitekit-data-block--button-2"
						title={ __( 'Page RPM', 'google-site-kit' ) }
						datapoint={ readableLargeNumber( totals[ 1 ], headers[ 1 ]?.currency ) }
						change={ ! isUndefined( prevTotals ) ? changeToPercent( prevTotals[ 1 ], totals[ 1 ] ) : 0 }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 1 }
						handleStatSelection={ handleStatSelection.bind( null, 1 ) }
					/>
				</Cell>

				<Cell align="top" smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 2 }
						className="googlesitekit-data-block--impression googlesitekit-data-block--button-3"
						title={ __( 'Impressions', 'google-site-kit' ) }
						datapoint={ readableLargeNumber( totals[ 2 ] ) }
						change={ ! isUndefined( prevTotals ) ? changeToPercent( prevTotals[ 2 ], totals[ 2 ] ) : 0 }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 2 }
						handleStatSelection={ handleStatSelection.bind( null, 2 ) }
					/>
				</Cell>

				<Cell align="top" smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
					<DataBlock
						stat={ 3 }
						className="googlesitekit-data-block--impression googlesitekit-data-block--button-4"
						title={ __( 'Page CTR', 'google-site-kit' ) }
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
	selectedStats: PropTypes.number.isRequired,
	handleStatSelection: PropTypes.func.isRequired,
};
