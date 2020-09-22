/**
 * AdSense Module Component Stories.
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
import DashboardSummaryWidget from '../assets/js/modules/adsense/components/dashboard/DashboardSummaryWidget';
import { STORE_NAME } from '../assets/js/modules/adsense/datastore';
import {
	dashboardSummaryWidgetTodayData,
	dashboardSummaryWidgetPeriodData,
	dashboardSummaryWidget28DailyData,
	dashboardSummaryWidgetTodayOptions,
	dashboardSummaryWidgetPeriodOptions,
	dashboardSummaryWidget28DailyOptions,
} from '../assets/js/modules/adsense/datastore/__fixtures__';

generateReportBasedWidgetStories( {
	moduleSlug: 'adsense',
	datastore: STORE_NAME,
	group: 'AdSense Module/Components/Dashboard/Summary Widget',
	data: [
		dashboardSummaryWidgetTodayData,
		dashboardSummaryWidgetPeriodData,
		dashboardSummaryWidget28DailyData,
	],
	options: [
		dashboardSummaryWidgetTodayOptions,
		dashboardSummaryWidgetPeriodOptions,
		dashboardSummaryWidget28DailyOptions,
	],
	component: DashboardSummaryWidget,
	wrapWidget: false,
} );
