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
import AdminBarActivateAnalyticsCTA from './AdminBarActivateAnalyticsCTA';
import AdminBarZeroData from './AdminBarZeroData';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { Row, Cell } from '../../material-components';
import { HIDDEN_CLASS } from '../../googlesitekit/widgets/util/constants';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util/get-widget-component-props';
const { useSelect } = Data;

// Widget slugs.
const WIDGET_IMPRESSIONS = 'adminBarImpressions';
const WIDGET_CLICKS = 'adminBarClicks';
const WIDGET_VISITORS = 'adminBarUniqueVisitors';
const WIDGET_SESSIONS = 'adminBarSessions';
// Search Console widgets.
const AdminBarImpressionsWidget =
	withWidgetComponentProps( WIDGET_IMPRESSIONS )( AdminBarImpressions );
const AdminBarClicksWidget =
	withWidgetComponentProps( WIDGET_CLICKS )( AdminBarClicks );
// Analytics Widgets.
const AdminBarUniqueVisitorsWidget = withWidgetComponentProps(
	WIDGET_VISITORS
)( AdminBarUniqueVisitors );
const AdminBarSessionsWidget =
	withWidgetComponentProps( WIDGET_SESSIONS )( AdminBarSessions );

export default function AdminBarWidgets() {
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);

	// True if _all_ admin bar widgets have zero data.
	const zeroData = ! analyticsModuleConnected;

	return (
		<Fragment>
			{ zeroData && <AdminBarZeroData /> }
			<Row className={ classnames( { [ HIDDEN_CLASS ]: zeroData } ) }>
				<Cell lgSize={ 3 } mdSize={ 2 }>
					<AdminBarImpressionsWidget />
				</Cell>
				<Cell lgSize={ 3 } mdSize={ 2 }>
					<AdminBarClicksWidget />
				</Cell>

				{ analyticsModuleConnected && analyticsModuleActive && (
					<Fragment>
						<Cell lgSize={ 3 } mdSize={ 2 }>
							<AdminBarUniqueVisitorsWidget />
						</Cell>
						<Cell lgSize={ 3 } mdSize={ 2 }>
							<AdminBarSessionsWidget />
						</Cell>
					</Fragment>
				) }

				{ ( ! analyticsModuleConnected || ! analyticsModuleActive ) && (
					<Cell lgSize={ 6 } mdSize={ 4 }>
						<AdminBarActivateAnalyticsCTA />
					</Cell>
				) }
			</Row>
		</Fragment>
	);
}
