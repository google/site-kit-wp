/**
 * Widgets API defaults
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
import { CONTEXT_DASHBOARD, CONTEXT_PAGE_DASHBOARD } from './default-contexts';
import {
	AREA_ALL_TRAFFIC,
	AREA_SEARCH_FUNNEL,
	AREA_POPULARITY,
	AREA_SPEED,
	AREA_EARNINGS,
} from './default-areas';

/**
 * Defines default widget areas for a given context.
 *
 * @since n.e.x.t
 *
 * @param {Object} widgetsApi Widgets API.
 */
export function registerDefaults( widgetsApi ) {
	const contexts = [ CONTEXT_DASHBOARD, CONTEXT_PAGE_DASHBOARD ];

	widgetsApi.registerWidgetArea( AREA_ALL_TRAFFIC, {
		title: 'All Triffic',
		subtitle: 'How people found your site.',
	}, contexts );

	widgetsApi.registerWidgetArea( AREA_SEARCH_FUNNEL, {
		title: 'Search Funnel',
		subtitle: 'How your site appeared in Search results and how many visitors you got from Search.',
	}, contexts );

	widgetsApi.registerWidgetArea( AREA_POPULARITY, {
		title: 'Popularity',
		subtitle: 'Your most popular pages and how people found them from Search.',
	}, contexts );

	widgetsApi.registerWidgetArea( AREA_SPEED, {
		title: 'Page Speed and Experience',
		subtitle: 'How fast your home page loads, how quickly people can interact with your content, and how stable your content is.',
	}, contexts );

	widgetsApi.registerWidgetArea( AREA_EARNINGS, {
		title: 'Earnings',
		subtitle: 'How much your site earns.',
	}, contexts );
}
