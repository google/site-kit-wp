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
import Data from 'googlesitekit-data';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { isZeroReport } from '../../../util';
import PreviewBlock from '../../../../../components/PreviewBlock';
import Header from './Header';
import Overview from './Overview';
import Stats from './Stats';
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
	const dateRangeLength = useSelect( ( select ) => select( CORE_USER ).getDateRangeNumberOfDays() );

	const WidgetHeader = () => (
		<Header
			metrics={ ModuleOverviewWidget.metrics }
			selectedStats={ selectedStats }
		/>
	);

	if ( loading ) {
		return (
			<Widget Header={ WidgetHeader } noPadding>
				<PreviewBlock width="100%" height="190px" padding />
				<PreviewBlock width="100%" height="270px" padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Header={ WidgetHeader }>
				<WidgetReportError moduleSlug="search-console" error={ error } />
			</Widget>
		);
	}

	if ( isZeroReport( data ) ) {
		return (
			<Widget Header={ WidgetHeader }>
				<WidgetReportZero moduleSlug="search-console" />
			</Widget>
		);
	}

	return (
		<Widget
			noPadding
			Header={ WidgetHeader }
		>
			<Overview
				data={ data }
				handleStatsSelection={ setSelectedStats }
				selectedStats={ selectedStats }
				dateRangeLength={ dateRangeLength }
			/>

			<Stats
				data={ data }
				dateRangeLength={ dateRangeLength }
				selectedStats={ selectedStats }
				metrics={ ModuleOverviewWidget.metrics }
			/>
		</Widget>
	);
};

ModuleOverviewWidget.metrics = [
	{
		color: '#4285f4',
		label: __( 'Clicks', 'google-site-kit' ),
		metric: 'clicks',
	},
	{
		color: '#27bcd4',
		label: __( 'Impressions', 'google-site-kit' ),
		metric: 'impressions',
	},
	{
		color: '#1b9688',
		label: __( 'CTR', 'google-site-kit' ),
		metric: 'ctr',
	},
	{
		color: '#673ab7',
		label: __( 'Position', 'google-site-kit' ),
		metric: 'position',
	},
];

ModuleOverviewWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default ModuleOverviewWidget;
