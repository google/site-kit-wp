/**
 * MaybeWidgetReportError component for SearchFunnelWidget.
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

/** External dependencies
 *
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Cell } from '../../../../../../material-components';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import useViewOnly from '../../../../../../hooks/useViewOnly';
const { useSelect } = Data;

const halfCellProps = {
	smSize: 4,
	mdSize: 4,
	lgSize: 6,
};

export default function MaybeWidgetReportError( {
	WidgetReportError,
	error,
	showRecoverableAnalytics,
} ) {
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const analyticsModuleActiveAndConnected =
		analyticsModuleActive && analyticsModuleConnected;

	const viewOnly = useViewOnly();

	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics' )
	);

	const canViewSharedAnalytics = useSelect( ( select ) => {
		if ( ! analyticsModuleAvailable ) {
			return false;
		}

		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics' );
	} );

	if (
		! (
			! showRecoverableAnalytics &&
			canViewSharedAnalytics &&
			analyticsModuleActiveAndConnected &&
			error
		)
	) {
		return null;
	}
	return (
		<Cell { ...halfCellProps }>
			<WidgetReportError moduleSlug="analytics" error={ error } />
		</Cell>
	);
}

MaybeWidgetReportError.propTypes = {
	showRecoverableAnalytics: PropTypes.bool,
};
