/**
 * Portal component.
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
import { useEffectOnce } from 'react-use';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createPortal, useState } from '@wordpress/element';

function Portal( { children, slug, appendPluginRoot } ) {
	const elDiv = document.createElement( 'div' );
	if ( slug ) {
		elDiv.classList.add( `googlesitekit-portal-${ slug }` );
	}

	if ( ! appendPluginRoot ) {
		elDiv.classList.add( 'googlesitekit-plugin' );
	}

	// Using state as we need `el` to not change when the component re-renders
	const [ el ] = useState( elDiv );

	useEffectOnce( () => {
		const root = appendPluginRoot ? document.querySelector( '.googlesitekit-plugin' ) || document.body : document.body;
		root.appendChild( el );

		return () => root.removeChild( el );
	} );

	return createPortal(
		children,
		el,
	);
}

Portal.propTypes = {
	slug: PropTypes.string,
	appendPluginRoot: PropTypes.bool,
};

Portal.defaultProps = {
	slug: '',
	appendPluginRoot: true,
};

export default Portal;
