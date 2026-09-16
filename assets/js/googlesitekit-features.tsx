/**
 * Feature Discovery Hub component.
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
 * External dependencies
 */
import { HashRouter } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FeatureDiscoveryApp from './components/feature-discovery/FeatureDiscoveryApp';
import Root from './components/Root';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from './googlesitekit/constants';

domReady( () => {
	const renderTarget = document.getElementById( 'js-googlesitekit-features' );

	if ( renderTarget ) {
		render(
			// @ts-expect-error Root is not properly typed yet.
			<Root viewContext={ VIEW_CONTEXT_FEATURE_DISCOVERY }>
				<HashRouter>
					<FeatureDiscoveryApp />
				</HashRouter>
			</Root>,
			renderTarget
		);
	}
} );
