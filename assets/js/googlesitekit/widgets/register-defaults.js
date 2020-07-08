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

/**
 * Defines default widget areas for a given context.
 *
 * @since n.e.x.t
 *
 * @param {Object} widgetsApi Widgets API.
 */
export function registerDefaults( widgetsApi ) {
	const contexts = [ CONTEXT_DASHBOARD, CONTEXT_PAGE_DASHBOARD ];
	for ( const contextSlug of contexts ) {
		widgetsApi.registerWidgetArea( `${ contextSlug }AllTraffic`, {
			title: 'All Triffic',
			subtitle: 'How people found your site.',
		} );

		widgetsApi.registerWidgetArea( `${ contextSlug }SearchFunnel`, {
			title: 'Search Funnel',
			subtitle: 'How your site appeared in Search results and how many visitors you got from Search.',
		} );

		widgetsApi.registerWidgetArea( `${ contextSlug }Popularity`, {
			title: 'Popularity',
			subtitle: 'Your most popular pages and how people found them from Search.',
		} );

		widgetsApi.registerWidgetArea( `${ contextSlug }Speed`, {
			title: 'Page Speed and Experience',
			subtitle: 'How fast your home page loads, how quickly people can interact with your content, and how stable your content is.',
		} );

		widgetsApi.registerWidgetArea( `${ contextSlug }Earnings`, {
			title: 'Earnings',
			subtitle: 'How much your site earns.',
		} );

		widgetsApi.assignWidgetArea( `${ contextSlug }AllTraffic`, contextSlug );
		widgetsApi.assignWidgetArea( `${ contextSlug }SearchFunnel`, contextSlug );
		widgetsApi.assignWidgetArea( `${ contextSlug }Popularity`, contextSlug );
		widgetsApi.assignWidgetArea( `${ contextSlug }Speed`, contextSlug );
		widgetsApi.assignWidgetArea( `${ contextSlug }Earnings`, contextSlug );
	}
}
