/**
 * AdSense module Component Stories.
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
import DashboardTopEarningPagesWidget from '../assets/js/modules/adsense/components/dashboard/DashboardTopEarningPagesWidget';
import { STORE_NAME as ANALYTICS_STORE } from '../assets/js/modules/analytics/datastore';
import {
	dashboardTopEarningPageWidgetArgs,
	dashboardTopEarningPageWidgetData,
} from '../assets/js/modules/adsense/datastore/__fixtures__';

generateReportBasedWidgetStories( {
	moduleSlug: [ 'adsense', 'analytics' ],
	datastore: ANALYTICS_STORE,
	group: 'AdSense Module/Components/Dashboard/Top Earning Pages Widget',
	data: dashboardTopEarningPageWidgetData,
	options: dashboardTopEarningPageWidgetArgs,
	component: DashboardTopEarningPagesWidget,
	wrapWidget: false,
	additionalVariants: {
		'AdSense Not Linked': ( { dispatch } ) => {
			dispatch( ANALYTICS_STORE ).receiveGetReport( dashboardTopEarningPageWidgetData, { options: dashboardTopEarningPageWidgetArgs } );
		},
	},
	additionalVariantCallbacks: {
		Loaded: ( dispatch ) => {
			dispatch( ANALYTICS_STORE ).setAdsenseLinked( true );
		},
		'Data Unavailable': ( dispatch ) => {
			dispatch( ANALYTICS_STORE ).setAdsenseLinked( true );
		},
	},
} );
