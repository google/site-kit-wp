/**
 * SideSheet component
 *
 * This component is named after Material Side Sheets
 * (https://m3.material.io/components/side-sheets/overview), which is
 * planned but not yet implemented for Web. Once available, we could look
 * into moving this to `googlesitekit-components` and replacing it with
 * the Material implementation.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Portal from './Portal';

export default function SideSheet( { className, children, isOpen } ) {
	// Disable scrolling on document body when panel is open.
	useEffect( () => {
		if ( isOpen ) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.removeProperty( 'overflow' );
		}
	}, [ isOpen ] );

	return (
		<Portal>
			<section
				className={ classnames( 'googlesitekit-side-sheet', className, {
					'googlesitekit-side-sheet--open': isOpen,
				} ) }
			>
				{ children }
			</section>
			{ isOpen && <span className="googlesitekit-side-sheet-overlay" /> }
		</Portal>
	);
}
