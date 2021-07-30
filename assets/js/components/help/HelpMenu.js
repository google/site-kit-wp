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
 * External dependencies
 */
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { useState, useRef, useCallback } from '@wordpress/element';
import { ESCAPE, TAB } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../Button';
import HelpIcon from '../../../svg/help.svg';
import HelpMenuLink from './HelpMenuLink';
import Menu from '../Menu';
import { useKeyCodesInside } from '../../hooks/useKeyCodesInside';

function HelpMenu( { children } ) {
	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef();

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );
	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () => setMenuOpen( false ) );

	const handleMenu = useCallback( () => {
		setMenuOpen( ! menuOpen );
	}, [ menuOpen ] );

	const handleMenuSelected = useCallback( () => {
		setMenuOpen( false );
	}, [] );

	return (
		<div ref={ menuWrapperRef } className="googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu googlesitekit-help-menu mdc-menu-surface--anchor">
			<Button
				aria-controls="googlesitekit-help-menu"
				aria-expanded={ menuOpen }
				aria-label={ __( 'Help', 'google-site-kit' ) }
				aria-haspopup="menu"
				className="googlesitekit-header__dropdown googlesitekit-help-menu__button googlesitekit-margin-right-0 mdc-button--dropdown"
				icon={ <HelpIcon width="20" height="20" /> }
				onClick={ handleMenu }
				text
			/>
			<Menu
				className="googlesitekit-width-auto"
				menuOpen={ menuOpen }
				id="googlesitekit-help-menu"
				onSelected={ handleMenuSelected }
			>
				{ children }
				<HelpMenuLink gaEventLabel="fix_common_issues" href="https://sitekit.withgoogle.com/documentation/fix-common-issues/">
					{ __( 'Fix common issues', 'google-site-kit' ) }
				</HelpMenuLink>
				<HelpMenuLink gaEventLabel="documentation" href="https://sitekit.withgoogle.com/documentation/">
					{ __( 'Read help docs', 'google-site-kit' ) }
				</HelpMenuLink>
				<HelpMenuLink gaEventLabel="support_forum" href="https://wordpress.org/support/plugin/google-site-kit/">
					{ __( 'Get support', 'google-site-kit' ) }
				</HelpMenuLink>
			</Menu>
		</div>
	);
}

export default HelpMenu;
