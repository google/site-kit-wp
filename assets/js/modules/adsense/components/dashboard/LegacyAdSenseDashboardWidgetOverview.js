/**
 * LegacyAdSenseDashboardWidgetOverview component.
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import ReportError from '../../../../components/ReportError';
import ReportZero from '../../../../components/ReportZero';
import { calculateChange } from '../../../../util';
import { isZeroReport } from '../../util';
const { useSelect } = Data;

export default function LegacyAdSenseDashboardWidgetOverview( props ) {
	const {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		metrics,
		selectedStats,
		handleStatSelection,
		handleDataError,
		handleDataSuccess,
	} = props;

	const currentRangeArgs = {
		metrics: Object.keys( metrics ),
		startDate,
		endDate,
	};

	const previousRangeArgs = {
		metrics: Object.keys( metrics ),
		startDate: compareStartDate,
		endDate: compareEndDate,
	};

	const currentRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( currentRangeArgs ) );
	const previousRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( previousRangeArgs ) );

	const currentDataLoaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ currentRangeArgs ] ) );
	const previousDataLoaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ previousRangeArgs ] ) );

	const currentError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ) );
	const previousError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ previousRangeArgs ] ) );

	// TODO: remove the following logic when AdSenseDashboardWidget is refactored.
	useEffect( () => {
		if ( currentDataLoaded && previousDataLoaded ) {
			if ( currentError || previousError ) {
				handleDataError( currentError || previousError );
			} else if ( isZeroReport( currentRangeData ) ) {
				handleDataError();
			} else {
				handleDataSuccess();
			}
		}
	}, [
		currentDataLoaded,
		currentError,
		currentRangeData,
		handleDataError,
		handleDataSuccess,
		previousDataLoaded,
		previousError,
	] );

	if ( ! currentDataLoaded || ! previousDataLoaded ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( currentError || previousError ) {
		const error = currentError || previousError;
		return <ReportError moduleSlug="adsense" error={ error } />;
	}

	if ( isZeroReport( currentRangeData ) ) {
		return <ReportZero moduleSlug="adsense" />;
	}

	const { totals, headers } = currentRangeData;
	const { totals: previousTotals } = previousRangeData;

	return (
		<div className="googlesitekit-adsense-performance-overview">
			<DataBlock
				stat={ 0 }
				className="googlesitekit-data-block--page-rpm googlesitekit-data-block--button-1"
				title={ metrics[ headers[ 0 ].name ] }
				datapoint={ totals?.cells[ 0 ].value || 0 }
				datapointUnit={ headers[ 0 ]?.currencyCode }
				change={ calculateChange(
					previousTotals?.cells[ 0 ].value || 0,
					totals?.cells[ 0 ].value || 0
				) }
				changeDataUnit="%"
				context="button"
				selected={ selectedStats === 0 }
				handleStatSelection={ () => handleStatSelection( 0 ) }
			/>

			<DataBlock
				stat={ 1 }
				className="googlesitekit-data-block--page-rpm googlesitekit-data-block--button-2"
				title={ metrics[ headers[ 1 ].name ] }
				datapoint={ totals?.cells[ 1 ].value || 0 }
				datapointUnit={ headers[ 1 ]?.currencyCode }
				change={ calculateChange(
					previousTotals?.cells[ 1 ].value || 0,
					totals?.cells[ 1 ].value || 0
				) }
				changeDataUnit="%"
				context="button"
				selected={ selectedStats === 1 }
				handleStatSelection={ () => handleStatSelection( 1 ) }
			/>

			<DataBlock
				stat={ 2 }
				className="googlesitekit-data-block--impression googlesitekit-data-block--button-3"
				title={ metrics[ headers[ 2 ].name ] }
				datapoint={ totals?.cells[ 2 ].value || 0 }
				change={ calculateChange(
					previousTotals?.cells[ 2 ].value || 0,
					totals?.cells[ 2 ].value || 0
				) }
				changeDataUnit="%"
				context="button"
				selected={ selectedStats === 2 }
				handleStatSelection={ () => handleStatSelection( 2 ) }
			/>

			<DataBlock
				stat={ 3 }
				className="googlesitekit-data-block--impression googlesitekit-data-block--button-4"
				title={ metrics[ headers[ 3 ].name ] }
				datapoint={ totals?.cells[ 3 ].value || 0 }
				datapointUnit={ '%' }
				change={ calculateChange(
					previousTotals?.cells[ 3 ].value || 0,
					totals?.cells[ 3 ].value || 0
				) }
				changeDataUnit="%"
				context="button"
				selected={ selectedStats === 3 }
				handleStatSelection={ () => handleStatSelection( 3 ) }
			/>
		</div>
	);
}

LegacyAdSenseDashboardWidgetOverview.propTypes = {
	startDate: PropTypes.string.isRequired,
	endDate: PropTypes.string.isRequired,
	compareStartDate: PropTypes.string.isRequired,
	compareEndDate: PropTypes.string.isRequired,
	metrics: PropTypes.shape( {} ).isRequired,
	selectedStats: PropTypes.number.isRequired,
	handleStatSelection: PropTypes.func.isRequired,
	handleDataError: PropTypes.func.isRequired,
	handleDataSuccess: PropTypes.func.isRequired,
};
