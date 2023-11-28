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
import AdminBarImpressions from './AdminBarImpressions';
import AdminBarClicks from './AdminBarClicks';
import AdminBarUniqueVisitorsGA4 from './AdminBarUniqueVisitorsGA4';
import AdminBarSessionsGA4 from './AdminBarSessionsGA4';
import AdminBarActivateAnalyticsCTA from './AdminBarActivateAnalyticsCTA';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { Row, Cell } from '../../material-components';
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

// Analytics 4 Widgets.
const AdminBarUniqueVisitorsGA4Widget = withWidgetComponentProps(
	WIDGET_VISITORS
)( AdminBarUniqueVisitorsGA4 );
const AdminBarSessionsGA4Widget =
	withWidgetComponentProps( WIDGET_SESSIONS )( AdminBarSessionsGA4 );

export default function AdminBarWidgets() {
	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics' )
	);
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);

	return (
		<Fragment>
			<Row>
				<Cell lgSize={ 3 } mdSize={ 2 }>
					<AdminBarImpressionsWidget />
				</Cell>
				<Cell lgSize={ 3 } mdSize={ 2 }>
					<AdminBarClicksWidget />
				</Cell>

				{ analyticsModuleConnected && analyticsModuleActive && (
					<Fragment>
						<Fragment>
							<Cell lgSize={ 3 } mdSize={ 2 }>
								<AdminBarUniqueVisitorsGA4Widget />
							</Cell>
							<Cell lgSize={ 3 } mdSize={ 2 }>
								<AdminBarSessionsGA4Widget />
							</Cell>
						</Fragment>
					</Fragment>
				) }

				{ analyticsModuleAvailable &&
					( ! analyticsModuleConnected ||
						! analyticsModuleActive ) && (
						<Cell lgSize={ 6 } mdSize={ 4 }>
							<AdminBarActivateAnalyticsCTA />
						</Cell>
					) }
			</Row>
		</Fragment>
	);
}
