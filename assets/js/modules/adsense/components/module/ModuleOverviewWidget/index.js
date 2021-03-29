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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { isZeroReport } from '../../../util';
import ProgressBar from '../../../../../components/ProgressBar';
import Header from './Header';
import Overview from './Overview';
import Stats from './Stats';
import Data from 'googlesitekit-data';
const { useSelect } = Data;

const ModuleOverviewWidget = ( { Widget, WidgetReportZero, WidgetReportError } ) => {
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
	} = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { compare: true } ) );

	const currentRangeArgs = {
		metrics: Object.keys( ModuleOverviewWidget.metrics ),
		startDate,
		endDate,
	};
	const previousRangeArgs = {
		metrics: Object.keys( ModuleOverviewWidget.metrics ),
		startDate: compareStartDate,
		endDate: compareEndDate,
	};
	const currentRangeChartArgs = {
		...currentRangeArgs,
		dimensions: [ 'DATE' ],
	};
	const previousRangeChartArgs = {
		...previousRangeArgs,
		dimensions: [ 'DATE' ],
	};

	const {
		currentRangeData,
		previousRangeData,
		currentRangeLoading,
		previousRangeLoading,
		currentRangeError,
		previousRangeError,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		return {
			currentRangeData: store.getReport( currentRangeArgs ),
			previousRangeData: store.getReport( previousRangeArgs ),
			currentRangeLoading: ! store.hasFinishedResolution( 'getReport', [ currentRangeArgs ] ),
			previousRangeLoading: ! store.hasFinishedResolution( 'getReport', [ previousRangeArgs ] ),
			currentRangeError: store.getErrorForSelector( 'getReport', [ currentRangeArgs ] ),
			previousRangeError: store.getErrorForSelector( 'getReport', [ previousRangeArgs ] ),
		};
	} );

	const {
		currentRangeChartData,
		previousRangeChartData,
		currentRangeChartLoading,
		previousRangeChartLoading,
		currentRangeChartError,
		previousRangeChartError,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		return {
			currentRangeChartData: store.getReport( currentRangeChartArgs ),
			previousRangeChartData: store.getReport( previousRangeChartArgs ),
			currentRangeChartLoading: ! store.hasFinishedResolution( 'getReport', [ currentRangeChartArgs ] ),
			previousRangeChartLoading: ! store.hasFinishedResolution( 'getReport', [ previousRangeChartArgs ] ),
			currentRangeChartError: store.getErrorForSelector( 'getReport', [ currentRangeChartArgs ] ),
			previousRangeChartError: store.getErrorForSelector( 'getReport', [ previousRangeChartArgs ] ),
		};
	} );

	if ( currentRangeLoading || previousRangeLoading || currentRangeChartLoading || previousRangeChartLoading ) {
		return <ProgressBar />;
	}

	if ( currentRangeError || previousRangeError || currentRangeChartError || previousRangeChartError ) {
		return (
			<WidgetReportError
				moduleSlug="adsense"
				error={ currentRangeError || previousRangeError || currentRangeChartError || previousRangeChartError }
			/>
		);
	}

	if ( isZeroReport( currentRangeData ) || isZeroReport( currentRangeChartData ) ) {
		return <WidgetReportZero moduleSlug="adsense" />;
	}

	return (
		<Widget
			noPadding
			Header={ Header }
		>
			<Overview
				metrics={ ModuleOverviewWidget.metrics }
				currentRangeData={ currentRangeData }
				previousRangeData={ previousRangeData }
				selectedStats={ selectedStats }
				handleStatsSelection={ setSelectedStats }
			/>

			<Stats
				metrics={ ModuleOverviewWidget.metrics }
				currentRangeData={ currentRangeChartData }
				previousRangeData={ previousRangeChartData }
				selectedStats={ selectedStats }
			/>
		</Widget>
	);
};

ModuleOverviewWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};

ModuleOverviewWidget.metrics = {
	EARNINGS: __( 'Earnings', 'google-site-kit' ),
	PAGE_VIEWS_RPM: __( 'Page RPM', 'google-site-kit' ),
	IMPRESSIONS: __( 'Impressions', 'google-site-kit' ),
	PAGE_VIEWS_CTR: __( 'Page CTR', 'google-site-kit' ),
};

export default ModuleOverviewWidget;
