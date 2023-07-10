/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { getAnalytics4MockResponse } from '../../assets/js/modules/analytics-4/utils/data-mock';
import { getSearchConsoleMockResponse } from '../../assets/js/modules/search-console/util/data-mock';
import { CORE_USER } from '../../assets/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../assets/js/googlesitekit/datastore/site/constants';
import {
	DATE_RANGE_OFFSET as ANALYTICS_4_DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../assets/js/modules/analytics-4/datastore/constants';
import {
	DATE_RANGE_OFFSET as SEARCH_CONSOLE_DATE_RANGE_OFFSET,
	MODULES_SEARCH_CONSOLE,
} from '../../assets/js/modules/search-console/datastore/constants';

export function getAnalytics4HasZeroDataReportOptions( registry ) {
	const { startDate, endDate } = registry
		.select( CORE_USER )
		.getDateRangeDates( {
			offsetDays: ANALYTICS_4_DATE_RANGE_OFFSET,
		} );

	const options = {
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate,
		endDate,
	};

	const url = registry.select( CORE_SITE ).getCurrentEntityURL();
	if ( url ) {
		options.url = url;
	}

	return options;
}

function provideAnalytics4GatheringDataState( registry, isGatheringData ) {
	invariant(
		isGatheringData !== true,
		"Analytics 4 gathering data's `true` state relies on the current authentication and selected property state so is unreliable to set from a helper, and therefore unsupported."
	);

	const options = getAnalytics4HasZeroDataReportOptions( registry );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( getAnalytics4MockResponse( options ), {
			options,
		} );
}

function provideSearchConsoleGatheringDataState( registry, isGatheringData ) {
	const rangeArgs = {
		compare: true,
		offsetDays: SEARCH_CONSOLE_DATE_RANGE_OFFSET,
	};

	const url = registry.select( CORE_SITE ).getCurrentEntityURL();
	const { compareStartDate: startDate, endDate } = registry
		.select( CORE_USER )
		.getDateRangeDates( rangeArgs );

	const options = {
		dimensions: 'date',
		startDate,
		endDate,
	};

	if ( url ) {
		options.url = url;
	}

	const reportData = isGatheringData
		? []
		: getSearchConsoleMockResponse( options );

	registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( reportData, {
		options,
	} );
}

const moduleProviderMap = {
	'analytics-4': provideAnalytics4GatheringDataState,
	'search-console': provideSearchConsoleGatheringDataState,
};

export function provideGatheringDataState( registry, moduleStates ) {
	Object.entries( moduleStates ).forEach( ( [ module, isGatheringData ] ) => {
		invariant(
			isGatheringData !== undefined,
			'Setting an undefined gathering data state is currently unsupported.'
		);

		const provideGatheringData = moduleProviderMap[ module ];

		if ( ! provideGatheringData ) {
			throw new Error( `Unhandled module: ${ module }` );
		}

		provideGatheringData( registry, isGatheringData );
	} );
}
