/**
 * Analytics Module Component Stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { generateReportBasedWidgetStories } from './utils/generate-widget-stories';
import DashboardAllTrafficWidget from '../assets/js/modules/analytics/components/dashboard/DashboardAllTrafficWidget';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore';
import {
	dashboardAllTrafficArgs,
	dashboardAllTrafficData,
	pageDashboardAllTrafficArgs,
	pageDashboardAllTrafficData,
} from '../assets/js/modules/analytics/datastore/__fixtures__';

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/All Traffic Widget',
	data: dashboardAllTrafficData,
	options: dashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/All Traffic Widget',
	data: pageDashboardAllTrafficData,
	options: pageDashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
} );
