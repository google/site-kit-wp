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
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Button from '../Button';
import LinkMenu from '../LinkMenu';
import HelpIcon from '../../../svg/help.svg';
import VisuallyHidden from '../VisuallyHidden';

const defaultMenuLinks = [
	{
		label: __( 'Fix common issues', 'google-site-kit' ),
		href: 'https://sitekit.withgoogle.com/documentation/fix-common-issues/',
	},
	{
		label: __( 'Read help docs', 'google-site-kit' ),
		href: 'https://sitekit.withgoogle.com/documentation/',
	},
	{
		label: __( 'Get support', 'google-site-kit' ),
		href: 'https://wordpress.org/support/plugin/google-site-kit/',
	},
];

function HelpMenu( { otherMenuLinks } ) {
	const [ menuOpen, toggleMenu ] = useState( false );
	const menuButtonRef = useRef();
	const menuRef = useRef();

	const menuLinks = Array.isArray( otherMenuLinks ) ? [ ...otherMenuLinks, ...defaultMenuLinks ] : defaultMenuLinks;

	useEffect( () => {
		const handleMenuClose = ( e ) => {
			if ( menuButtonRef?.current && menuRef?.current ) {
				// Close the menu if the user presses the Escape key
				// or if they click outside of the menu.
				if (
					( ( 'keyup' === e.type && ESCAPE === e.keyCode ) || 'mouseup' === e.type ) &&
					! menuButtonRef.current.contains( e.target ) &&
					! menuRef.current.contains( e.target )
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

	const visuallyHiddenText = () => {
		return (
			<VisuallyHidden>Help</VisuallyHidden>
		);
	};

	return (
		<Fragment>
			<div className="googlesitekit-user-selector googlesitekit-dropdown-menu mdc-menu-surface--anchor">
				<Button
					ref={ menuButtonRef }
					className="googlesitekit-header__dropdown mdc-button--dropdown"
					text
					onClick={ handleMenu }
					icon={ <HelpIcon width="20" height="20" /> }
					aria-haspopup="menu"
					aria-expanded={ menuOpen }
					aria-controls="help-menu"
				>
					{ visuallyHiddenText() }
				</Button>
				<LinkMenu
					ref={ menuRef }
					menuOpen={ menuOpen }
					menuLinks={ menuLinks }
					id="help-menu" />
			</div>
		</Fragment>
	);
}

export default HelpMenu;
