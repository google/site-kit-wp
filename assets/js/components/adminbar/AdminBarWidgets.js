/**
 * Admin Bar widgets.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdminBarUniqueVisitors from './AdminBarUniqueVisitors';
import AdminBarSessions from './AdminBarSessions';
import AdminBarImpressions from './AdminBarImpressions';
import AdminBarClicks from './AdminBarClicks';
import AnalyticsInactiveCTA from '../AnalyticsInactiveCTA';
import CompleteModuleActivationCTA from '../CompleteModuleActivationCTA';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { Grid, Row, Cell } from '../../material-components';
import AdminBarZeroData from './AdminBarZeroData';
const { useSelect } = Data;

export default function AdminBarWidgets() {
	const analyticsModuleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'analytics' ) );
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );

	// True if _all_ admin bar sections have zero data.
	const zeroData = useSelect( ( select ) => {
		return AdminBarImpressions.selectHasZeroData( select ) &&
			AdminBarClicks.selectHasZeroData( select ) &&
			AdminBarUniqueVisitors.selectHasZeroData( select ) &&
			AdminBarSessions.selectHasZeroData( select );
	} );

	if ( zeroData ) {
		return <AdminBarZeroData />;
	}

	return (
		<Grid>
			<Row>
				<AdminBarImpressions />
				<AdminBarClicks />

				{ analyticsModuleConnected && analyticsModuleActive && (
					<Fragment>
						<AdminBarUniqueVisitors />
						<AdminBarSessions />
					</Fragment>
				) }

				{ ( ! analyticsModuleConnected || ! analyticsModuleActive ) && (
					<Cell lgSize={ 6 } mdSize={ 4 }>
						{ ! analyticsModuleActive && (
							<AnalyticsInactiveCTA />
						) }

						{ ( analyticsModuleActive && ! analyticsModuleConnected ) && (
							<CompleteModuleActivationCTA slug="analytics" />
						) }
					</Cell>
				) }
			</Row>
		</Grid>
	);
}
