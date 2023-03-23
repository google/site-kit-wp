/**
 * WidgetRecoverableModules component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useWidgetStateEffect from '../hooks/useWidgetStateEffect';
import RecoverableModules from '../../../components/RecoverableModules';

// The supported props must match `RecoverableModules` (except `widgetSlug`).
export default function WidgetRecoverableModules( {
	widgetSlug,
	moduleSlugs,
	...props
} ) {
	const metadata = useMemo(
		() => ( {
			// Here we serialize to `moduleSlug` for compatibility with the logic in
			// `combineWidgets()`. In future we may wish to take a less "hacky" approach.
			// See https://github.com/google/site-kit-wp/issues/5376#issuecomment-1165771399.
			moduleSlug: [ ...moduleSlugs ].sort().join( ',' ),
			// We also store `moduleSlugs` in the metadata in order for it to be passed back
			// into RecoverableModules as a prop.
			// See https://github.com/google/site-kit-wp/blob/c272c20eddcca61aae24c9812b6b11dbc15ec673/assets/js/googlesitekit/widgets/components/WidgetAreaRenderer.js#L171.
			moduleSlugs,
		} ),
		[ moduleSlugs ]
	);
	useWidgetStateEffect( widgetSlug, RecoverableModules, metadata );

	return <RecoverableModules moduleSlugs={ moduleSlugs } { ...props } />;
}

WidgetRecoverableModules.propTypes = {
	widgetSlug: PropTypes.string.isRequired,
	...RecoverableModules.propTypes,
};
