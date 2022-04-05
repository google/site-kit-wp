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
import PropTypes from 'prop-types';
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { useState, useRef, useCallback, useContext } from '@wordpress/element';
import { ESCAPE, TAB } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import HelpIcon from '../../../svg/icons/help.svg';
import { useKeyCodesInside } from '../../hooks/useKeyCodesInside';
import { trackEvent } from '../../util';
import ViewContextContext from '../Root/ViewContextContext';
import Button from '../Button';
import Menu from '../Menu';
import HelpMenuLink from './HelpMenuLink';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

export default function HelpMenu( { children } ) {
	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef();
	const viewContext = useContext( ViewContextContext );

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );
	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () =>
		setMenuOpen( false )
	);

	const adSenseModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'adsense' )
	);

	const handleMenu = useCallback( () => {
		if ( ! menuOpen ) {
			trackEvent( `${ viewContext }_headerbar`, 'open_helpmenu' );
		}

		setMenuOpen( ! menuOpen );
	}, [ menuOpen, viewContext ] );

	const handleMenuSelected = useCallback( () => {
		setMenuOpen( false );
	}, [] );

	return (
		<div
			ref={ menuWrapperRef }
			className="googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu mdc-menu-surface--anchor"
		>
			<Button
				aria-controls="googlesitekit-help-menu"
				aria-expanded={ menuOpen }
				aria-label={ __( 'Help', 'google-site-kit' ) }
				aria-haspopup="menu"
				className="googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon googlesitekit-help-menu__button mdc-button--dropdown"
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
				<HelpMenuLink
					gaEventLabel="fix_common_issues"
					href="https://sitekit.withgoogle.com/documentation/troubleshooting/fix-common-issues/"
				>
					{ __( 'Fix common issues', 'google-site-kit' ) }
				</HelpMenuLink>
				<HelpMenuLink
					gaEventLabel="documentation"
					href="https://sitekit.withgoogle.com/documentation/"
				>
					{ __( 'Read help docs', 'google-site-kit' ) }
				</HelpMenuLink>
				<HelpMenuLink
					gaEventLabel="support_forum"
					href="https://wordpress.org/support/plugin/google-site-kit/"
				>
					{ __( 'Get support', 'google-site-kit' ) }
				</HelpMenuLink>
				{ adSenseModuleActive && (
					<HelpMenuLink
						gaEventLabel="adsense_help"
						href="https://support.google.com/adsense/"
					>
						{ __( 'Get help with AdSense', 'google-site-kit' ) }
					</HelpMenuLink>
				) }
			</Menu>
		</div>
	);
}

HelpMenu.propTypes = {
	children: PropTypes.node,
};
