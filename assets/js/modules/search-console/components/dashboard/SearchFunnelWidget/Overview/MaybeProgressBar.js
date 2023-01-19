/**
 * MaybeProgressBar component for SearchFunnelWidget.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { Cell } from '../../../../../../material-components';
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../../../../analytics/datastore/constants';
const { useSelect } = Data;

const halfCellProps = {
	smSize: 4,
	mdSize: 4,
	lgSize: 6,
};

export default function MaybeProgressBar() {
	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics' )
	);

	const isNavigatingToReauthURL = useSelect( ( select ) => {
		if ( ! analyticsModuleAvailable ) {
			return false;
		}
		const adminReauthURL = select( MODULES_ANALYTICS ).getAdminReauthURL();
		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );

	if ( ! isNavigatingToReauthURL ) {
		return null;
	}

	return (
		<Cell
			{ ...halfCellProps }
			className="googlesitekit-data-block__loading"
		>
			<ProgressBar />
		</Cell>
	);
}
