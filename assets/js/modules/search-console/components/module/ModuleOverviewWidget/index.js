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
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { isZeroReport } from '../../../util';
import Header from './Header';
import Overview from './Overview';
import Stats from './Stats';
import Data from 'googlesitekit-data';
const { useSelect } = Data;

const ModuleOverviewWidget = ( { Widget, WidgetReportZero, WidgetReportError } ) => {
	const [ selectedStats, setSelectedStats ] = useState( 0 );
	const { endDate, compareStartDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );
	const reportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};
	const data = useSelect( ( select ) => select( STORE_NAME ).getReport( reportArgs ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ reportArgs ] ) );
	const loading = useSelect( ( select ) => ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ reportArgs ] ) );
	const handleStatsSelection = useCallback( ( stat ) => {
		setSelectedStats( stat );
	}, [] );

	if ( error ) {
		return <WidgetReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero moduleSlug="search-console" />;
	}

	return (
		<Widget
			noPadding
			Header={ Header }
		>
			<Overview
				data={ data }
				loading={ loading }
				handleStatsSelection={ handleStatsSelection }
				selectedStats={ selectedStats }
			/>

			<Stats
				data={ data }
				loading={ loading }
				selectedStats={ selectedStats }
			/>
		</Widget>
	);
};

export default ModuleOverviewWidget;
