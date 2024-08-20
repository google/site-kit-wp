/**
 * `useModuleGatheringZeroData` hook.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../modules/search-console/datastore/constants';
import useViewOnly from './useViewOnly';

/**
 * Determines if either Search Console or Analytics is in gathering or zero data states.
 *
 * @since n.e.x.t
 *
 * @return {Object} Individual boolean|undefined values for Gathering and Zero data states for both modules.
 */
export default function useModuleGatheringZeroData() {
	const viewOnly = useViewOnly();

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const canViewSharedAnalytics = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics-4' );
	} );
	const canViewSharedSearchConsole = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'search-console' );
	} );

	const showRecoverableAnalytics = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return false;
		}

		const recoverableModules =
			select( CORE_MODULES ).getRecoverableModules();

		if ( recoverableModules === undefined ) {
			return undefined;
		}

		return Object.keys( recoverableModules ).includes( 'analytics-4' );
	} );
	const showRecoverableSearchConsole = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return false;
		}

		const recoverableModules =
			select( CORE_MODULES ).getRecoverableModules();

		if ( recoverableModules === undefined ) {
			return undefined;
		}

		return Object.keys( recoverableModules ).includes( 'search-console' );
	} );

	const analyticsGatheringData = useInViewSelect(
		( select ) =>
			isAnalyticsConnected &&
			canViewSharedAnalytics &&
			false === showRecoverableAnalytics
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: false,
		[
			isAnalyticsConnected,
			canViewSharedAnalytics,
			showRecoverableAnalytics,
		]
	);
	const searchConsoleGatheringData = useInViewSelect(
		( select ) =>
			canViewSharedSearchConsole &&
			false === showRecoverableSearchConsole &&
			select( MODULES_SEARCH_CONSOLE ).isGatheringData(),
		[ canViewSharedSearchConsole, showRecoverableSearchConsole ]
	);

	const analyticsHasZeroData = useInViewSelect(
		( select ) =>
			isAnalyticsConnected &&
			canViewSharedAnalytics &&
			false === showRecoverableAnalytics
				? select( MODULES_ANALYTICS_4 ).hasZeroData()
				: false,
		[
			isAnalyticsConnected,
			canViewSharedAnalytics,
			showRecoverableAnalytics,
		]
	);
	const searchConsoleHasZeroData = useInViewSelect(
		( select ) =>
			canViewSharedSearchConsole &&
			false === showRecoverableSearchConsole &&
			select( MODULES_SEARCH_CONSOLE ).hasZeroData(),
		[ canViewSharedSearchConsole, showRecoverableSearchConsole ]
	);

	return {
		analyticsGatheringData,
		searchConsoleGatheringData,
		analyticsHasZeroData,
		searchConsoleHasZeroData,
	};
}
