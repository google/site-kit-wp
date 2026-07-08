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
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import PreviewBlock from '@/js/components/PreviewBlock';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import {
	SITE_STATUS_ADDED,
	legacyAccountStatuses,
} from '@/js/modules/adsense/util';
import whenActive from '@/js/util/when-active';
import Footer from './Footer';
import Header from './Header';
import Overview from './Overview';
import {
	MODULE_OVERVIEW_METRICS,
	getCurrentRangeArgs,
	getCurrentRangeChartArgs,
	getPreviousRangeArgs,
	getPreviousRangeChartArgs,
} from './reportOptions';
import Stats from './Stats';
import StatusMigration from './StatusMigration';

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

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} )
	);

	const currentRangeArgs = getCurrentRangeArgs( dates );
	const previousRangeArgs = getPreviousRangeArgs( dates );
	const currentRangeChartArgs = getCurrentRangeChartArgs( dates );
	const previousRangeChartArgs = getPreviousRangeChartArgs( dates );

	const currentRangeData = useInViewSelect(
		( select ) => select( MODULES_ADSENSE ).getReport( currentRangeArgs ),
		[ currentRangeArgs ]
	);
	const previousRangeData = useInViewSelect(
		( select ) => select( MODULES_ADSENSE ).getReport( previousRangeArgs ),
		[ previousRangeArgs ]
	);
	const currentRangeChartData = useInViewSelect(
		( select ) =>
			select( MODULES_ADSENSE ).getReport( currentRangeChartArgs ),
		[ currentRangeChartArgs ]
	);
	const previousRangeChartData = useInViewSelect(
		( select ) =>
			select( MODULES_ADSENSE ).getReport( previousRangeChartArgs ),
		[ previousRangeChartArgs ]
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
		<Widget Header={ Header } Footer={ Footer } noPadding>
			{ ! viewOnlyDashboard && legacyStatus && <StatusMigration /> }
			<Overview
				metrics={ MODULE_OVERVIEW_METRICS }
				currentRangeData={ currentRangeData }
				previousRangeData={ previousRangeData }
				selectedStats={ selectedStats }
				handleStatsSelection={ setSelectedStats }
			/>

			<Stats
				metrics={ MODULE_OVERVIEW_METRICS }
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

export default whenActive( {
	moduleName: MODULE_SLUG_ADSENSE,
} )( ModuleOverviewWidget );
