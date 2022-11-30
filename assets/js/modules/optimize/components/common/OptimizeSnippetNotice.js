/**
 * OptimizeSnippetNotice component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';

const { useSelect } = Data;

export default function OptimizeSnippetNotice() {
	const analytics4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const useGA4Snippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUseSnippet()
	);

	const useUASnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);

	let notice = null;

	if ( ! useUASnippet && analytics4ModuleConnected && ! useGA4Snippet ) {
		notice = __(
			'Site Kit is currently configured to neither place the Universal Analytics snippet nor the Google Analytics 4 snippet. If you have manually inserted these snippets, you will have to modify them to include the Optimize Container ID, or alternatively you will need to enable Site Kit to place them.',
			'google-site-kit'
		);
	} else if (
		! useUASnippet &&
		( ! analytics4ModuleConnected || useGA4Snippet )
	) {
		notice = __(
			'Site Kit is currently configured to not place the Universal Analytics snippet. If you have manually inserted this snippet, you will have to modify it to include the Optimize Container ID, or alternatively you will need to enable Site Kit to place it.',
			'google-site-kit'
		);
	} else if ( analytics4ModuleConnected && ! useGA4Snippet && useUASnippet ) {
		notice = __(
			'Site Kit is currently configured to not place the Google Analytics 4 snippet. If you have manually inserted this snippet, you will have to modify it to include the Optimize Container ID, or alternatively you will need to enable Site Kit to place it.',
			'google-site-kit'
		);
	}

	if ( ! notice ) {
		return null;
	}

	return <p>{ notice }</p>;
}
