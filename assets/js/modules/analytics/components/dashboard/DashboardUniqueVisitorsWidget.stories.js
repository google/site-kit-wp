/**
 * Button Component Stories.
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
 * Internal dependencies
 */
import { CORE_WIDGETS, WIDGET_WIDTHS, WIDGET_AREA_STYLES } from '../../../../googlesitekit/widgets/datastore/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WidgetAreaRenderer from '../../../../googlesitekit/widgets/components/WidgetAreaRenderer';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardSearchVisitorsWidget from './DashboardSearchVisitorsWidget';

export const Loaded = () => <DashboardSearchVisitorsWidget />;
export const Loading = () => <DashboardSearchVisitorsWidget />;
export const DataUnavailable = () => <DashboardSearchVisitorsWidget />;
export const Error = () => <DashboardSearchVisitorsWidget />;
export const Zoe = () => <p>asvin</p>;

const areaName = 'moduleAdsenseMain';
const widgetSlug = 'adsenseModuleOverview';
export default {
	title: 'Modules/Analytics/Widgets/DashboardSearchVisitorsWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				const { dispatch } = registry;

				provideModules( registry, [ {
					active: true,
					connected: true,
					slug: 'analytics',
				} ] );

				dispatch( CORE_WIDGETS ).registerWidgetArea( areaName, {
					title: 'Overview',
					style: WIDGET_AREA_STYLES.BOXES,
				} );

				dispatch( CORE_WIDGETS ).registerWidget( widgetSlug, {
					Component: DashboardSearchVisitorsWidget,
					width: WIDGET_WIDTHS.FULL,
				} );

				dispatch( CORE_WIDGETS ).assignWidget( widgetSlug, areaName );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<WidgetAreaRenderer slug={ areaName } />
				</WithRegistrySetup>
			);
		},
	],
};