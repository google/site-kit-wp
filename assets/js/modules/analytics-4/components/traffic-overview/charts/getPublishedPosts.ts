/**
 * Traffic Overview chart's published posts.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { BenchmarkingContentMarker } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getFullURL } from '@/js/util';
import { PublishedPost } from './getTrafficChartData';

/**
 * Lists the posts of the benchmarking response's content markers, as the
 * traffic chart marks them.
 *
 * Analytics reports each post by its path, so each post's URL is its path on
 * the site.
 *
 * @since n.e.x.t
 *
 * @param {Array}  contentMarkers The content markers of the benchmarking response, oldest first.
 * @param {string} siteURL        The site's URL.
 * @return {Array} One post for each post of each marker, in the markers' order, each with its marker's `date`.
 */
export function getPublishedPosts(
	contentMarkers: BenchmarkingContentMarker[] = [],
	siteURL: string
): PublishedPost[] {
	return contentMarkers.flatMap( ( { date, posts } ) =>
		posts.map( ( { title, url } ) => ( {
			date,
			title,
			url: getFullURL( siteURL, url ),
		} ) )
	);
}
