/**
 * ModuleOverviewWidget component stories.
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
import { WithTestRegistry } from '../../../../../../../tests/js/utils';
import * as fixtures from '../../../datastore/__fixtures__';
import { STORE_NAME } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS, WIDGET_WIDTHS, WIDGET_AREA_STYLES } from '../../../../../googlesitekit/widgets/datastore/constants';
import WidgetAreaRenderer from '../../../../../googlesitekit/widgets/components/WidgetAreaRenderer';
import ModuleOverviewWidget from './index';

export const Performance = () => {
	const areaName = 'moduleAdsenseMain';
	const widgetSlug = 'adsenseModuleOverview';

	const setupRegistry = ( { dispatch, select } ) => {
		dispatch( CORE_WIDGETS ).registerWidgetArea( areaName, {
			title: 'Overview',
			style: WIDGET_AREA_STYLES.BOXES,
		} );

		dispatch( CORE_WIDGETS ).registerWidget( widgetSlug, {
			Component: ModuleOverviewWidget,
			width: WIDGET_WIDTHS.FULL,
		} );

		dispatch( CORE_WIDGETS ).assignWidget( widgetSlug, areaName );

		const {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} = select( CORE_USER ).getDateRangeDates( { compare: true } );

		const currentStatsArgs = {
			...fixtures.earnings.currentStatsArgs,
			startDate,
			endDate,
		};

		const prevStatsArgs = {
			...fixtures.earnings.prevStatsArgs,
			startDate: compareStartDate,
			endDate: compareEndDate,
		};

		const currentSummaryArgs = {
			...fixtures.earnings.currentSummaryArgs,
			startDate,
			endDate,
		};

		const prevSummaryArgs = {
			...fixtures.earnings.prevSummaryArgs,
			startDate: compareStartDate,
			endDate: compareEndDate,
		};

		dispatch( STORE_NAME ).receiveGetReport( fixtures.earnings.currentStatsData, { options: currentStatsArgs } );
		dispatch( STORE_NAME ).finishResolution( 'getReport', [ currentStatsArgs ] );
		dispatch( STORE_NAME ).receiveGetReport( fixtures.earnings.prevStatsData, { options: prevStatsArgs } );
		dispatch( STORE_NAME ).finishResolution( 'getReport', [ prevStatsArgs ] );

		dispatch( STORE_NAME ).receiveGetReport( fixtures.earnings.currentSummaryData, { options: currentSummaryArgs } );
		dispatch( STORE_NAME ).finishResolution( 'getReport', [ currentSummaryArgs ] );
		dispatch( STORE_NAME ).receiveGetReport( fixtures.earnings.prevSummaryData, { options: prevSummaryArgs } );
		dispatch( STORE_NAME ).finishResolution( 'getReport', [ prevSummaryArgs ] );
	};

	return (
		<WithTestRegistry callback={ setupRegistry }>
			<WidgetAreaRenderer slug={ areaName } />
		</WithTestRegistry>
	);
};

export default {
	title: 'Modules/AdSense/Widgets/ModuleOverviewWidget',
};
