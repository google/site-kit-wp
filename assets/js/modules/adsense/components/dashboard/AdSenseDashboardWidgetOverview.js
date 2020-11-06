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
import isUndefined from 'lodash/isUndefined';

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
import { readableLargeNumber, changeToPercent, numberFormat } from '../../../../util';
// import { isDataZeroAdSense } from '../../util';
const { useSelect } = Data;

export default function AdSenseDashboardWidgetOverview() {
	const {
		currentRangeData,
		currentRangeError,
		currentRangeLoading,
		prevRangeData,
		prevRangeLoading,
		prevRangeError,
	} = useSelect( ( select ) => {
		const {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} = select( CORE_USER ).getDateRangeDates( { compare: true } );

		const metrics = [
			'EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
			'PAGE_VIEWS_CTR',
		];

		const currentRangeArgs = {
			metrics,
			startDate,
			endDate,
		};

		const prevRangeArgs = {
			metrics,
			startDate: compareStartDate,
			endDate: compareEndDate,
		};

		return {
			currentRangeData: select( STORE_NAME ).getReport( currentRangeArgs ),
			currentRangeLoading: select( STORE_NAME ).isResolving( 'getReport', [ currentRangeArgs ] ),
			currentRangeError: select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ),
			prevRangeData: select( STORE_NAME ).getReport( prevRangeArgs ),
			prevRangeLoading: select( STORE_NAME ).isResolving( 'getReport', [ prevRangeArgs ] ),
			prevRangeError: select( STORE_NAME ).getErrorForSelector( 'getReport', [ prevRangeArgs ] ),
		};
	} );

	if ( currentRangeLoading || prevRangeLoading ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( currentRangeError ) {
		return getDataErrorComponent( 'adsense', currentRangeError.message, false, false, false, currentRangeError );
	}

	if ( prevRangeError ) {
		return getDataErrorComponent( 'adsense', prevRangeError.message, false, false, false, prevRangeError );
	}

	const dataBlocks = currentRangeData.totals ? [
		{
			className: 'googlesitekit-data-block--page-rpm',
			title: __( 'Earnings', 'google-site-kit' ),
			datapoint: readableLargeNumber( currentRangeData.totals[ 0 ], currentRangeData.headers[ 0 ]?.currency ),
			change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 0 ], currentRangeData.totals[ 0 ] ) : 0,
			changeDataUnit: '%',
		},
		{
			className: 'googlesitekit-data-block--page-rpm',
			title: __( 'Page RPM', 'google-site-kit' ),
			datapoint: readableLargeNumber( currentRangeData.totals[ 1 ], currentRangeData.headers[ 1 ]?.currency ),
			change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 1 ], currentRangeData.totals[ 1 ] ) : 0,
			changeDataUnit: '%',
		},
		{
			className: 'googlesitekit-data-block--impression',
			title: __( 'Impressions', 'google-site-kit' ),
			datapoint: readableLargeNumber( currentRangeData.totals[ 2 ] ),
			change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 2 ], currentRangeData.totals[ 2 ] ) : 0,
			changeDataUnit: '%',
		},
		{
			className: 'googlesitekit-data-block--impression',
			title: __( 'Page CTR', 'google-site-kit' ),
			/* translators: %s: percentage value. */
			datapoint: sprintf( _x( ' %1$s%%', 'AdSense performance Page CTA percentage', 'google-site-kit' ), numberFormat( currentRangeData.totals[ 3 ] * 100, { maximumFractionDigits: 2 } ) ),
			change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 3 ], currentRangeData.totals[ 3 ] ) : 0,
			changeDataUnit: '%',
		},
	] : [];

	return (
		<Grid>
			<Row>
				{ dataBlocks.map( ( block, i ) => (
					<Cell
						key={ i }
						className="mdc-layout-grid__cell--align-top"
						smSize={ 2 }
						mdSize={ 2 }
						lgSize={ 3 }
					>
						<DataBlock
							stat={ i }
							className={ block.className }
							title={ block.title }
							datapoint={ block.datapoint }
							change={ block.change }
							changeDataUnit={ block.changeDataUnit }
							context={ block.context }
							selected={ block.selected }
							handleStatSelection={ block.handleStatSelection }
						/>
					</Cell>
				) ) }
			</Row>
		</Grid>
	);
}
