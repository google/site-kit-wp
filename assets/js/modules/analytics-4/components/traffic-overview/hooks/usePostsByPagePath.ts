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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { PagePathPost } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ErrorObject } from '@/js/util/errors';

export interface PostsByPagePath {
	/** The post or `null` of each page path, or `undefined` until they load and after their request fails. */
	posts?: Record< string, PagePathPost | null >;
	/** `true` until the request has finished, whether it succeeded or failed. */
	loading: boolean;
	/** The error of the request, or `undefined` when the request hasn't failed. */
	error?: ErrorObject;
}

/**
 * Resolves the post that each of the given page paths shows.
 *
 * With no page paths, the hook requests nothing, and `posts` is an empty
 * object.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} pagePaths The page paths with their query strings, such as `/?p=123`. Pass an array that changes only when the page paths do.
 * @return {Object} The posts, whether they are loading, and the error of their request.
 */
export function usePostsByPagePath( pagePaths: string[] ): PostsByPagePath {
	const hasPagePaths = pagePaths.length > 0;

	const posts = useInViewSelect<
		Record< string, PagePathPost | null > | undefined
	>(
		( select: Select ) =>
			hasPagePaths
				? select( MODULES_ANALYTICS_4 ).getPostsByPagePath( pagePaths )
				: {},
		[ hasPagePaths, pagePaths ]
	);

	const loading = useSelect(
		( select: Select ) =>
			hasPagePaths &&
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getPostsByPagePath',
				[ pagePaths ]
			),
		[ hasPagePaths, pagePaths, posts ]
	);

	const error = useSelect(
		( select: Select ) =>
			hasPagePaths
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getPostsByPagePath',
						[ pagePaths ]
				  )
				: undefined,
		[ hasPagePaths, pagePaths, posts ]
	);

	return { posts, loading, error };
}
