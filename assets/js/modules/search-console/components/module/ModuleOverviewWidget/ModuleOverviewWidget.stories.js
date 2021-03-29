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
import { WithTestRegistry, provideModules } from '../../../../../../../tests/js/utils';
import { adminbarSearchConsoleMockData, adminbarSearchConsoleOptions } from '../../../datastore/__fixtures__';
import { STORE_NAME } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS, WIDGET_WIDTHS, WIDGET_AREA_STYLES } from '../../../../../googlesitekit/widgets/datastore/constants';
import WidgetAreaRenderer from '../../../../../googlesitekit/widgets/components/WidgetAreaRenderer';
import ModuleOverviewWidget from './index';

export const Performance = () => {
	const areaName = 'moduleSearchConsoleMain';
	const widgetSlug = 'searchConsoleModuleOverview';

	const setupRegistry = ( registry ) => {
		const { dispatch } = registry;

		dispatch( CORE_WIDGETS ).registerWidgetArea( areaName, {
			title: 'Overview',
			style: WIDGET_AREA_STYLES.BOXES,
		} );

		dispatch( CORE_WIDGETS ).registerWidget( widgetSlug, {
			Component: ModuleOverviewWidget,
			width: WIDGET_WIDTHS.FULL,
		} );

		dispatch( CORE_WIDGETS ).assignWidget( widgetSlug, areaName );

		provideModules( registry, [
			{ slug: 'search-console', active: true, connected: true },
			{ slug: 'analytics', active: true, connected: true },
		] );

		dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
		dispatch( STORE_NAME ).receiveGetReport( adminbarSearchConsoleMockData, { options: { ...adminbarSearchConsoleOptions, url: undefined } } );
	};

	return (
		<WithTestRegistry callback={ setupRegistry }>
			<WidgetAreaRenderer slug={ areaName } />
		</WithTestRegistry>
	);
};

export default {
	title: 'Modules/Search Console/Widgets/ModuleOverviewWidget',
};
