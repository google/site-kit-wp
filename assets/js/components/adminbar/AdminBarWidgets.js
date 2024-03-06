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
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
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
	const canViewSharedAnalytics = useSelect( ( select ) =>
		select( CORE_USER ).hasAccessToShareableModule( 'analytics-4' )
	);
	const canViewSharedSearchConsole = useSelect( ( select ) =>
		select( CORE_USER ).hasAccessToShareableModule( 'search-console' )
	);

	const searchConsoleSize = canViewSharedAnalytics
		? { lg: 3, md: 2 }
		: { lg: 6, md: 4 };
	const analyticsSize = canViewSharedSearchConsole
		? { lg: 3, md: 2 }
		: { lg: 6, md: 4 };

	return (
		<Fragment>
			<Row>
				{ canViewSharedSearchConsole && (
					<Fragment>
						<Cell
							lgSize={ searchConsoleSize.lg }
							mdSize={ searchConsoleSize.md }
						>
							<AdminBarImpressionsWidget />
						</Cell>
						<Cell
							lgSize={ searchConsoleSize.lg }
							mdSize={ searchConsoleSize.md }
						>
							<AdminBarClicksWidget />
						</Cell>
					</Fragment>
				) }

				{ analyticsModuleConnected &&
					analyticsModuleActive &&
					canViewSharedAnalytics && (
						<Fragment>
							<Fragment>
								<Cell
									lgSize={ analyticsSize.lg }
									mdSize={ analyticsSize.md }
								>
									<AdminBarUniqueVisitorsGA4Widget />
								</Cell>
								<Cell
									lgSize={ analyticsSize.lg }
									mdSize={ analyticsSize.md }
								>
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
