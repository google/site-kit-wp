/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { getAnalytics4MockResponse } from '../../assets/js/modules/analytics-4/utils/data-mock';
import { getSearchConsoleMockResponse } from '../../assets/js/modules/search-console/util/data-mock';
import { MODULES_ANALYTICS_4 } from '../../assets/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../assets/js/modules/search-console/datastore/constants';

/**
 * Provides the required data to the given registry to ensure the gathering data state is set for the Analytics 4 module.
 *
 * @since 1.106.0
 *
 * @param {Object}  registry        Data registry object.
 * @param {boolean} isGatheringData The desired gathering data state.
 */
function provideAnalytics4GatheringDataState( registry, isGatheringData ) {
	invariant(
		isGatheringData !== true,
		"Analytics 4 gathering data's `true` state relies on the current authentication and selected property state so is unreliable to set from a helper, and therefore unsupported."
	);

	const options = registry
		.select( MODULES_ANALYTICS_4 )
		.getSampleReportArgs();

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( getAnalytics4MockResponse( options ), {
			options,
		} );
}

/**
 * Provides the required data to the given registry to ensure the gathering data state is set for the Search Console module.
 *
 * @since 1.106.0
 *
 * @param {Object}  registry        Data registry object.
 * @param {boolean} isGatheringData The desired gathering data state.
 */
function provideSearchConsoleGatheringDataState( registry, isGatheringData ) {
	const options = registry
		.select( MODULES_SEARCH_CONSOLE )
		.getSampleReportArgs();

	const reportData = isGatheringData
		? []
		: getSearchConsoleMockResponse( options );

	registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( reportData, {
		options,
	} );
}

const moduleDataProviderMap = {
	'analytics-4': provideAnalytics4GatheringDataState,
	'search-console': provideSearchConsoleGatheringDataState,
};

/**
 * Provides the required data to the given registry to ensure the gathering data state is set for the specified modules.
 *
 * Initially defined to support the Analytics 4 and Search Console modules, with more to be added as needed.
 *
 * Setting up Analytics 4 to return `true` for gathering data is unsupported as it relies on the current authentication and selected property state,
 * making it impractical to set from a helper as these states will differ across test scenarios.
 *
 * @since 1.106.0
 *
 * @param {Object} registry     Registry to provide the data to.
 * @param {Object} moduleStates Object keyed by module slug with a boolean value indicating whether the module should be gathering data.
 */
export function provideGatheringDataState( registry, moduleStates ) {
	Object.entries( moduleStates ).forEach(
		( [ moduleSlug, isGatheringData ] ) => {
			invariant(
				isGatheringData !== undefined,
				'Setting an undefined gathering data state is currently unsupported.'
			);

			const provideGatheringData = moduleDataProviderMap[ moduleSlug ];

			if ( ! provideGatheringData ) {
				throw new Error( `Unhandled module: ${ moduleSlug }` );
			}

			provideGatheringData( registry, isGatheringData );
		}
	);
}
