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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Cell } from '../../../../../../material-components';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { ActivateAnalyticsCTA } from '../../../common';
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
	halfCellProps,
	quarterCellProps,
	showAnalytics,
	showGoalsCTA,
	showRecoverableAnalytics,
	WidgetReportError,
} ) {
	const breakpoint = useBreakpoint();

	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const analyticsModuleActiveAndConnected =
		analyticsModuleActive && analyticsModuleConnected;

	return (
		<Fragment>
			{ canViewSharedAnalytics &&
				( ! analyticsModuleConnected || ! analyticsModuleActive ) && (
					<Cell { ...halfCellProps }>
						{ BREAKPOINT_SMALL !== breakpoint && (
							<ActivateAnalyticsCTA
								title={ __(
									'Goals completed',
									'google-site-kit'
								) }
							/>
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

OptionalCells.propTypes = {
	canViewSharedAnalytics: PropTypes.bool.isRequired,
	error: PropTypes.object,
	halfCellProps: PropTypes.object.isRequired,
	quarterCellProps: PropTypes.object.isRequired,
	showAnalytics: PropTypes.bool.isRequired,
	showGoalsCTA: PropTypes.bool.isRequired,
	showRecoverableAnalytics: PropTypes.bool,
	WidgetReportError: PropTypes.elementType.isRequired,
};
