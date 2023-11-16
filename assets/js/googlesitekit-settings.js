/**
 * Settings component.
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
 * External dependencies
 */
import { HashRouter } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Root from './components/Root';
import SettingsApp from './components/settings/SettingsApp';
import { VIEW_CONTEXT_SETTINGS } from './googlesitekit/constants';

// Initialize the app once the DOM is ready.
domReady( () => {
	const renderTarget = document.getElementById( 'js-googlesitekit-settings' );

	if ( renderTarget ) {
		const root = createRoot( renderTarget );

		root.render(
			<Root viewContext={ VIEW_CONTEXT_SETTINGS }>
				<HashRouter>
					<SettingsApp />
				</HashRouter>
			</Root>
		);
	}
} );
