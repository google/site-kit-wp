/**
 * Traffic Overview `usePostsByPagePath` hook.
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
import { Select, useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { PostsByPagePath } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ErrorObject } from '@/js/util/errors';

interface PagePathPosts {
	/** The post of each page path, or `undefined` until every page path has loaded, and after the request fails. */
	posts?: PostsByPagePath;
	/** `true` until the request has finished, whether it succeeded or failed, and while the page paths are `undefined`. */
	loading: boolean;
	/** The error of the request, or `undefined` when the request hasn't failed. */
	error?: ErrorObject;
}

/**
 * Resolves the post that each of a list of page paths shows, on plain permalinks.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} [pagePaths] Optional. The page paths, at most `POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS`, such as `/?p=123`, or `undefined` while they load.
 * @return {Object} The posts, whether they are loading, and the error of their request.
 */
export function usePostsByPagePath( pagePaths?: string[] ): PagePathPosts {
	const posts = useSelect(
		( select: Select ) =>
			pagePaths
				? select( MODULES_ANALYTICS_4 ).getPostsByPagePath( pagePaths )
				: undefined,
		[ pagePaths ]
	);

	const loading = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getPostsByPagePath',
				[ pagePaths ]
			),
		[ pagePaths ]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getPostsByPagePath',
				[ pagePaths ]
			),
		[ pagePaths ]
	);

	return { posts, loading, error };
}
