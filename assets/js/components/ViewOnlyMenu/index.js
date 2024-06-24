/**
 * ViewOnlyMenu component.
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
import { useClickAway } from 'react-use';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Button, Menu } from 'googlesitekit-components';
import useViewContext from '../../hooks/useViewContext';
import { useKeyCodesInside } from '../../hooks/useKeyCodesInside';
import { trackEvent } from '../../util';
import ViewIcon from '../../../svg/icons/view.svg';
import Description from './Description';
import SharedServices from './SharedServices';
import Tracking from './Tracking';
import { useSelect } from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
} from '../../googlesitekit/datastore/user/constants';

export default function ViewOnlyMenu() {
	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef();
	const viewContext = useViewContext();

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );
	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () =>
		setMenuOpen( false )
	);

	const toggleMenu = useCallback( () => {
		if ( ! menuOpen ) {
			trackEvent( `${ viewContext }_headerbar`, 'open_viewonly' );
		}

		setMenuOpen( ! menuOpen );
	}, [ menuOpen, viewContext ] );

	const canAuthenticate = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_AUTHENTICATE )
	);

	return (
		<div
			ref={ menuWrapperRef }
			className={ classnames(
				'googlesitekit-view-only-menu',
				'googlesitekit-dropdown-menu',
				'googlesitekit-dropdown-menu__icon-menu',
				'mdc-menu-surface--anchor',
				{
					'googlesitekit-view-only-menu--user-can-authenticate':
						canAuthenticate,
				}
			) }
		>
			<Button
				className="googlesitekit-header__dropdown mdc-button--dropdown googlesitekit-border-radius-round--phone googlesitekit-button-icon"
				text
				onClick={ toggleMenu }
				icon={
					<span className="mdc-button__icon" aria-hidden="true">
						<ViewIcon className="mdc-button__icon--image" />
					</span>
				}
				aria-haspopup="menu"
				aria-expanded={ menuOpen }
				aria-controls="view-only-menu"
				aria-label={ __( 'View only', 'google-site-kit' ) }
				tooltip
				tooltipEnterDelayInMS={ 500 }
			>
				{ __( 'View only', 'google-site-kit' ) }
			</Button>
			<Menu
				menuOpen={ menuOpen }
				nonInteractive
				onSelected={ toggleMenu }
				id="view-only-menu"
			>
				<Description />
				<SharedServices />
				<li className="mdc-list-divider" role="separator"></li>
				<Tracking />
			</Menu>
		</div>
	);
}
