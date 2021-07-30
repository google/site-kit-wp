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
import DashboardZeroData from '../../dashboard/DashboardZeroData';
import { HIDDEN_CLASS } from '../../../../../googlesitekit/widgets/util/constants';
import PreviewBlock from '../../../../../components/PreviewBlock';
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

	const currentRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( currentRangeArgs ) );
	const previousRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( previousRangeArgs ) );
	const currentRangeChartData = useSelect( ( select ) => select( STORE_NAME ).getReport( currentRangeChartArgs ) );
	const previousRangeChartData = useSelect( ( select ) => select( STORE_NAME ).getReport( previousRangeChartArgs ) );

	const loading = useSelect( ( select ) => (
		! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ currentRangeArgs ] ) ||
		! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ previousRangeArgs ] ) ||
		! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ currentRangeChartArgs ] ) ||
		! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ previousRangeChartArgs ] )
	) );

	const error = useSelect( ( select ) => (
		select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ) ||
		select( STORE_NAME ).getErrorForSelector( 'getReport', [ previousRangeArgs ] ) ||
		select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeChartArgs ] ) ||
		select( STORE_NAME ).getErrorForSelector( 'getReport', [ previousRangeChartArgs ] )
	) );

	if ( loading ) {
		return (
			<Widget Header={ Header } noPadding>
				<PreviewBlock width="100%" height="190px" padding />
				<PreviewBlock width="100%" height="270px" padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Header={ Header }>
				<WidgetReportError
					moduleSlug="adsense"
					error={ error }
				/>
			</Widget>
		);
	}

	if ( isZeroReport( currentRangeData ) || isZeroReport( currentRangeChartData ) ) {
		return (
			<Widget noPadding>
				<DashboardZeroData />
				<div className={ HIDDEN_CLASS }>
					<WidgetReportZero moduleSlug="adsense" />
				</div>
			</Widget>
		);
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
	ESTIMATED_EARNINGS: __( 'Earnings', 'google-site-kit' ),
	PAGE_VIEWS_RPM: __( 'Page RPM', 'google-site-kit' ),
	IMPRESSIONS: __( 'Impressions', 'google-site-kit' ),
	PAGE_VIEWS_CTR: __( 'Page CTR', 'google-site-kit' ),
};

export default ModuleOverviewWidget;
