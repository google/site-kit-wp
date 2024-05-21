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
import FocusTrap from 'focus-trap-react';
import PropTypes from 'prop-types';
import { useClickAway, useKey } from 'react-use';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Portal from './Portal';

export default function SideSheet( {
	className,
	children,
	isOpen,
	onOpen = () => {},
	closeSheet = () => {},
	focusTrapOptions = {},
} ) {
	const sideSheetRef = useRef();

	useEffect( () => {
		if ( isOpen ) {
			onOpen();

			document.body.classList.add(
				'googlesitekit-side-sheet-scroll-lock'
			);
		} else {
			document.body.classList.remove(
				'googlesitekit-side-sheet-scroll-lock'
			);
		}
	}, [ isOpen, onOpen ] );

	useClickAway( sideSheetRef, closeSheet );

	useKey( ( event ) => isOpen && ESCAPE === event.keyCode, closeSheet );

	return (
		<Portal>
			<FocusTrap
				active={ !! isOpen }
				focusTrapOptions={ {
					fallbackFocus: 'body',
					...focusTrapOptions,
				} }
			>
				<section
					ref={ sideSheetRef }
					className={ classnames(
						'googlesitekit-side-sheet',
						className,
						{
							'googlesitekit-side-sheet--open': isOpen,
						}
					) }
					role="dialog"
					aria-modal="true"
					aria-hidden={ ! isOpen }
					tabIndex="0"
				>
					{ children }
				</section>
			</FocusTrap>
			{ isOpen && <span className="googlesitekit-side-sheet-overlay" /> }
		</Portal>
	);
}

SideSheet.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
	isOpen: PropTypes.bool,
	onOpen: PropTypes.func,
	closeSheet: PropTypes.func,
	focusTrapOptions: PropTypes.object,
};
