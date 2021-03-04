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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS } from '../../../datastore/constants';
import ProgressBar from '../../../../../components/ProgressBar';
import Header from './Header';
import Overview from './Overview';
import SiteStats from './SiteStats';
const { useSelect } = Data;

export default function ModuleOverviewWidget( { Widget, WidgetReportError } ) {
	const [ selectedStat, setSelectedState ] = useState( 0 );

	const {
		users,
		sessions,
		bounceRate,
		avgSessionDuration,
		loaded,
		error,
	} = useSelect( ( select ) => {
		const {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} = select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} );

		return [ 'users', 'sessions', 'bounceRate', 'avgSessionDuration' ].reduce(
			( acc, metric ) => {
				const args = {
					startDate,
					endDate,
					compareStartDate,
					compareEndDate,
					dimensions: 'ga:date',
					metrics: [ `ga:${ metric }` ],
				};

				return {
					...acc,
					[ metric ]: select( MODULES_ANALYTICS ).getReport( args ),
					loaded: acc.loaded && select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ args ] ),
					error: acc.error || select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] ),
				};
			},
			{ loaded: true },
		);
	} );

	if ( ! loaded ) {
		return <ProgressBar />;
	}

	if ( error ) {
		return <WidgetReportError error={ error } />;
	}

	return (
		<Widget Header={ Header }>
			<Overview
				users={ users }
				sessions={ sessions }
				bounce={ bounceRate }
				duration={ avgSessionDuration }
				selectedStat={ selectedStat }
				handleStatSelection={ setSelectedState }
			/>

			<SiteStats
				selectedStat={ selectedStat }
				report={ [ users, sessions, bounceRate, avgSessionDuration ][ selectedStat ] }
			/>
		</Widget>
	);
}

ModuleOverviewWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};
