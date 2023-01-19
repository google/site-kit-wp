/**
 * OptionalCells component for SearchFunnelWidget.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { Cell } from '../../../../../../material-components';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../../../../analytics/datastore/constants';
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import ActivateAnalyticsCTA from '../ActivateAnalyticsCTA';
import CreateGoalCTA from '../CreateGoalCTA';
import RecoverableModules from '../../../../../../components/RecoverableModules';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../../../hooks/useBreakpoint';
const { useSelect } = Data;

export default function OptionalCells( {
	canViewSharedAnalytics,
	error,
	showAnalytics,
	showGoalsCTA,
	showRecoverableAnalytics,
	WidgetReportError,
	halfCellProps,
	quarterCellProps,
} ) {
	const breakpoint = useBreakpoint();

	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics' )
	);

	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const analyticsModuleActiveAndConnected =
		analyticsModuleActive && analyticsModuleConnected;

	const isNavigatingToReauthURL = useSelect( ( select ) => {
		if ( ! analyticsModuleAvailable ) {
			return false;
		}
		const adminReauthURL = select( MODULES_ANALYTICS ).getAdminReauthURL();
		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );

	return (
		<Fragment>
			{ isNavigatingToReauthURL && (
				<Cell
					{ ...halfCellProps }
					className="googlesitekit-data-block__loading"
				>
					<ProgressBar />
				</Cell>
			) }

			{ canViewSharedAnalytics &&
				( ! analyticsModuleConnected || ! analyticsModuleActive ) &&
				! isNavigatingToReauthURL && (
					<Cell { ...halfCellProps }>
						{ BREAKPOINT_SMALL !== breakpoint && (
							<ActivateAnalyticsCTA />
						) }
					</Cell>
				) }

			{ ! showRecoverableAnalytics &&
				canViewSharedAnalytics &&
				analyticsModuleActiveAndConnected &&
				error && (
					<Cell { ...halfCellProps }>
						<WidgetReportError
							moduleSlug="analytics"
							error={ error }
						/>
					</Cell>
				) }

			{ showAnalytics && (
				<Cell { ...quarterCellProps } smSize={ 4 }>
					{ showGoalsCTA && <CreateGoalCTA /> }
				</Cell>
			) }

			{ canViewSharedAnalytics &&
				analyticsModuleActiveAndConnected &&
				showRecoverableAnalytics && (
					<Cell { ...halfCellProps }>
						<RecoverableModules moduleSlugs={ [ 'analytics' ] } />
					</Cell>
				) }
		</Fragment>
	);
}
