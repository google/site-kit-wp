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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdminBarImpressions from './AdminBarImpressions';
import AdminBarClicks from './AdminBarClicks';
import AdminBarUniqueVisitors from './AdminBarUniqueVisitors';
import AdminBarSessions from './AdminBarSessions';
import ActivateModuleCTA from '../ActivateModuleCTA';
import CompleteModuleActivationCTA from '../CompleteModuleActivationCTA';
import AdminBarZeroData from './AdminBarZeroData';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { Row, Cell } from '../../material-components';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { HIDDEN_CLASS } from '../../googlesitekit/widgets/util/constants';
import ReportZero from '../ReportZero';
const { useSelect } = Data;

export default function AdminBarWidgets() {
	const analyticsModuleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'analytics' ) );
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );

	const searchConsoleZeroData = useSelect( ( select ) => {
		return select( CORE_WIDGETS ).getWidgetState( 'adminBarImpressions' )?.Component === ReportZero &&
		select( CORE_WIDGETS ).getWidgetState( 'adminBarClicks' )?.Component === ReportZero;
	} );

	const analyticsZeroData = useSelect( ( select ) => {
		return select( CORE_WIDGETS ).getWidgetState( 'adminBarUniqueVisitors' )?.Component === ReportZero &&
			select( CORE_WIDGETS ).getWidgetState( 'adminBarSessions' )?.Component === ReportZero;
	} );

	// True if _all_ admin bar widgets have zero data.
	const zeroData = (
		searchConsoleZeroData &&
			// Only check analytics module widgets if the module is active.
			( analyticsModuleConnected && analyticsModuleActive && (
				analyticsZeroData
			) )
	);

	return (
		<Fragment>
			{ zeroData && (
				<AdminBarZeroData />
			) }
			<Row className={ classnames( { [ HIDDEN_CLASS ]: zeroData } ) }>
				<Cell lgSize={ searchConsoleZeroData ? 6 : 3 } mdSize={ searchConsoleZeroData ? 4 : 2 }>
					<AdminBarImpressions />
				</Cell>
				<Cell lgSize={ 3 } mdSize={ 2 } className={ classnames( { [ HIDDEN_CLASS ]: searchConsoleZeroData } ) } >
					<AdminBarClicks />
				</Cell>

				{ analyticsModuleConnected && analyticsModuleActive && (
					<Fragment>
						<Cell lgSize={ 3 } mdSize={ 2 }>
							<AdminBarUniqueVisitors />
						</Cell>
						<Cell lgSize={ 3 } mdSize={ 2 }>
							<AdminBarSessions />
						</Cell>
					</Fragment>
				) }

				{ ( ! analyticsModuleConnected || ! analyticsModuleActive ) && (
					<Cell lgSize={ 6 } mdSize={ 4 }>
						{ ! analyticsModuleActive && (
							<ActivateModuleCTA moduleSlug="analytics" />
						) }

						{ ( analyticsModuleActive && ! analyticsModuleConnected ) && (
							<CompleteModuleActivationCTA moduleSlug="analytics" />
						) }
					</Cell>
				) }
			</Row>
		</Fragment>
	);
}
