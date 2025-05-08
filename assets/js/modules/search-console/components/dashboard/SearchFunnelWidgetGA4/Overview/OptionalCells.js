/**
 * OptionalCells component for SearchFunnelWidgetGA4.
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
import { useSelect } from 'googlesitekit-data';
import { Cell } from '../../../../../../material-components';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { ActivateAnalyticsCTA } from '../../../common';
import CreateConversionCTA from '../CreateConversionCTA';
import RecoverableModules from '../../../../../../components/RecoverableModules';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../../../hooks/useBreakpoint';
import { getCellProps } from './utils';

export default function OptionalCells( {
	canViewSharedAnalytics4,
	error,
	showGA4,
	showConversionsCTA,
	showRecoverableGA4,
	WidgetReportError,
} ) {
	const breakpoint = useBreakpoint();

	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const ga4ModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
	);
	const analyticsModuleActiveAndConnected =
		ga4ModuleActive && ga4ModuleConnected;

	const { quarterCellProps, halfCellProps } =
		getCellProps( showConversionsCTA );

	return (
		<Fragment>
			{ canViewSharedAnalytics4 &&
				( ! ga4ModuleConnected || ! ga4ModuleActive ) && (
					<Cell { ...halfCellProps }>
						{ BREAKPOINT_SMALL !== breakpoint && (
							<ActivateAnalyticsCTA
								title={ __(
									'Conversions completed',
									'google-site-kit'
								) }
							/>
						) }
					</Cell>
				) }

			{ ! showRecoverableGA4 &&
				canViewSharedAnalytics4 &&
				analyticsModuleActiveAndConnected &&
				error && (
					<Cell { ...halfCellProps }>
						<WidgetReportError
							moduleSlug="analytics-4"
							error={ error }
						/>
					</Cell>
				) }

			{ showGA4 && (
				<Cell { ...quarterCellProps } smSize={ 4 }>
					{ showConversionsCTA && <CreateConversionCTA /> }
				</Cell>
			) }

			{ canViewSharedAnalytics4 &&
				analyticsModuleActiveAndConnected &&
				showRecoverableGA4 && (
					<Cell { ...halfCellProps }>
						<RecoverableModules moduleSlugs={ [ 'analytics-4' ] } />
					</Cell>
				) }
		</Fragment>
	);
}

OptionalCells.propTypes = {
	canViewSharedAnalytics4: PropTypes.bool.isRequired,
	error: PropTypes.object,
	showGA4: PropTypes.bool.isRequired,
	showConversionsCTA: PropTypes.bool.isRequired,
	showRecoverableGA4: PropTypes.bool,
	WidgetReportError: PropTypes.elementType.isRequired,
};
