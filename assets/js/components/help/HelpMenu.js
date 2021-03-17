/**
 * HelpMenu component.
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
import { Fragment, useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../Button';
import HelpIcon from '../../../svg/help.svg';
import VisuallyHidden from '../VisuallyHidden';
import HelpMenuLink from './HelpMenuLink';
import Menu from '../Menu';

function HelpMenu( { children } ) {
	const [ menuOpen, toggleMenu ] = useState( false );
	const menuButtonRef = useRef();
	const menuRef = useRef();

	useEffect( () => {
		const handleMenuClose = ( event ) => {
			if ( menuButtonRef?.current && menuRef?.current ) {
				// Close the menu if the user presses the Escape key
				// or if they click outside of the menu.
				if (
					( ( 'keyup' === event.type && ESCAPE === event.keyCode ) || 'mouseup' === event.type ) &&
					! menuButtonRef.current.contains( event.target ) &&
					! menuRef.current.contains( event.target )
				) {
					toggleMenu( false );
				}
			}
		};

		global.addEventListener( 'mouseup', handleMenuClose );
		global.addEventListener( 'keyup', handleMenuClose );

		return () => {
			global.removeEventListener( 'mouseup', handleMenuClose );
			global.removeEventListener( 'keyup', handleMenuClose );
		};
	}, [] );

	const handleMenu = useCallback( () => {
		toggleMenu( ! menuOpen );
	}, [ menuOpen ] );

	return (
		<Fragment>
			<div className="googlesitekit-user-selector googlesitekit-dropdown-menu googlesitekit-help-menu mdc-menu-surface--anchor">
				<Button
					aria-controls="help-menu"
					aria-expanded={ menuOpen }
					aria-haspopup="menu"
					className="googlesitekit-header__dropdown googlesitekit-help-menu__button mdc-button--dropdown"
					icon={ <HelpIcon fill="currentColor" width="20" height="20" /> }
					onClick={ handleMenu }
					ref={ menuButtonRef }
					text
				>
					<VisuallyHidden>{ __( 'Help', 'google-site-kit' ) }</VisuallyHidden>
				</Button>
				<Menu
					ref={ menuRef }
					menuOpen={ menuOpen }
					id="googlesitekit-help-menu"
				>
					{ children }
					<HelpMenuLink href="https://sitekit.withgoogle.com/documentation/fix-common-issues/">
						{ __( 'Fix common issues', 'google-site-kit' ) }
					</HelpMenuLink>
					<HelpMenuLink href="https://sitekit.withgoogle.com/documentation/">
						{ __( 'Read help docs', 'google-site-kit' ) }
					</HelpMenuLink>
					<HelpMenuLink href="https://wordpress.org/support/plugin/google-site-kit/">
						{ __( 'Get support', 'google-site-kit' ) }
					</HelpMenuLink>
				</Menu>
			</div>
		</Fragment>
	);
}

export default HelpMenu;
