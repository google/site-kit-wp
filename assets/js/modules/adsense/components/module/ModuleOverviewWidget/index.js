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
import {
	MODULES_ADSENSE,
	DATE_RANGE_OFFSET,
} from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { SITE_STATUS_ADDED, legacyAccountStatuses } from '../../../util';
import PreviewBlock from '../../../../../components/PreviewBlock';
import whenActive from '../../../../../util/when-active';
import Header from './Header';
import Footer from './Footer';
import Overview from './Overview';
import Stats from './Stats';
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import StatusMigration from './StatusMigration';
import useViewOnly from '../../../../../hooks/useViewOnly';

function ModuleOverviewWidget( { Widget, WidgetReportError } ) {
	const viewOnlyDashboard = useViewOnly();
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const accountStatus = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ADSENSE ).getAccountStatus();
	} );

	const siteStatus = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ADSENSE ).getSiteStatus();
	} );

	const legacyStatus =
		legacyAccountStatuses.includes( accountStatus ) ||
		siteStatus === SITE_STATUS_ADDED;

	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect(
		( select ) =>
			select( CORE_USER ).getDateRangeDates( {
				compare: true,
				offsetDays: DATE_RANGE_OFFSET,
			} )
	);

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

	const currentRangeData = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( currentRangeArgs )
	);
	const previousRangeData = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( previousRangeArgs )
	);
	const currentRangeChartData = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( currentRangeChartArgs )
	);
	const previousRangeChartData = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( previousRangeChartArgs )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ADSENSE ).hasFinishedResolution( 'getReport', [
				currentRangeArgs,
			] ) ||
			! select( MODULES_ADSENSE ).hasFinishedResolution( 'getReport', [
				previousRangeArgs,
			] ) ||
			! select( MODULES_ADSENSE ).hasFinishedResolution( 'getReport', [
				currentRangeChartArgs,
			] ) ||
			! select( MODULES_ADSENSE ).hasFinishedResolution( 'getReport', [
				previousRangeChartArgs,
			] )
	);

	const errors = useSelect( ( select ) => [
		...[
			select( MODULES_ADSENSE ).getErrorForSelector( 'getReport', [
				currentRangeArgs,
			] ),
		],
		...[
			select( MODULES_ADSENSE ).getErrorForSelector( 'getReport', [
				previousRangeArgs,
			] ),
		],
		...[
			select( MODULES_ADSENSE ).getErrorForSelector( 'getReport', [
				currentRangeChartArgs,
			] ),
		],
		...[
			select( MODULES_ADSENSE ).getErrorForSelector( 'getReport', [
				previousRangeChartArgs,
			] ),
		],
	] ).filter( Boolean );

	if ( loading ) {
		return (
			<Widget Header={ Header } Footer={ Footer } noPadding>
				<PreviewBlock width="100%" height="190px" padding />
				<PreviewBlock width="100%" height="270px" padding />
			</Widget>
		);
	}

	if ( !! errors.length ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportError moduleSlug="adsense" error={ errors } />
			</Widget>
		);
	}

	return (
		<Widget noPadding Header={ Header } Footer={ Footer }>
			{ ! viewOnlyDashboard && legacyStatus && <StatusMigration /> }
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
}

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

export default whenActive( {
	moduleName: 'adsense',
} )( ModuleOverviewWidget );
