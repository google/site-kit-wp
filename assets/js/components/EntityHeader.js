/**
 * EntityHeader component.
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
import classnames from 'classnames';
import { useWindowScroll } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useContext,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ViewContextContext from './Root/ViewContextContext';
import { VIEW_CONTEXT_PAGE_DASHBOARD } from '../googlesitekit/constants';
import Button from './Button';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import BackspaceIcon from '../../svg/keyboard-backspace.svg';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import Link from './Link';
const { useSelect, useDispatch } = Data;

const EntityHeader = () => {
	const viewContext = useContext( ViewContextContext );
	const currentEntityTitle = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityTitle()
	);
	const entityURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const headerRef = useRef();
	const [ url, setURL ] = useState( entityURL );

	useEffect( () => {
		const shortenURL = () => {
			if ( ! headerRef.current ) {
				return;
			}

			const entityHeaderWidth = headerRef.current.clientWidth;

			const paddingLeft = global
				.getComputedStyle( headerRef.current, null )
				.getPropertyValue( 'padding-left' );
			const paddingRight = global
				.getComputedStyle( headerRef.current, null )
				.getPropertyValue( 'padding-right' );
			const entityHeaderPadding =
				parseFloat( paddingLeft ) + parseFloat( paddingRight );

			const headerDetailsWidth =
				( entityHeaderWidth - entityHeaderPadding ) * 0.8; // headerDetails is 80% of header
			const urlWidth = headerDetailsWidth - 20 - 16; // padding: entity-header__details = 20px, url <a> = 16px

			const urlFontSize = global
				.getComputedStyle( headerRef.current.lastChild.lastChild, null ) // url <a> element
				.getPropertyValue( 'font-size' );
			const size = parseFloat( urlFontSize );

			// 2 is appox. the min character constant for sans-serif fonts:
			// https://pearsonified.com/characters-per-line/
			const maxChars = ( urlWidth * 2 ) / size;

			const shortenedURL = new URL( entityURL );

			if ( maxChars < entityURL.length ) {
				const extraChars = entityURL.length - maxChars + 4; // length of "/..."
				const origin = shortenedURL.origin;
				const restOfURL = shortenedURL.toString().replace( origin, '' );
				const newRestOfURL = '/...' + restOfURL.substr( extraChars );
				setURL( origin + newRestOfURL );
			} else {
				setURL( entityURL );
			}
		};

		shortenURL();

		global.addEventListener( 'resize', shortenURL );
		return () => {
			global.removeEventListener( 'resize', shortenURL );
		};
	}, [ entityURL, headerRef, setURL ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const returnURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const onClick = useCallback( () => {
		navigateTo( returnURL );
	}, [ returnURL, navigateTo ] );

	const { y } = useWindowScroll();

	if (
		VIEW_CONTEXT_PAGE_DASHBOARD !== viewContext ||
		entityURL === null ||
		currentEntityTitle === null
	) {
		return null;
	}

	return (
		<div
			className={ classnames( 'googlesitekit-entity-header', {
				'googlesitekit-entity-header--has-scrolled': y > 1,
			} ) }
			ref={ headerRef }
		>
			<div className="googlesitekit-entity-header__back">
				<Button
					icon={ <BackspaceIcon width={ 24 } height={ 24 } /> }
					// This is duplicated because on small screens, the text supplied to the
					// Button is rendered as a sub-component and is set to `display: none`,
					// but the button itself remains on-screen (and thus this aria-label is
					// accessible to screen-readers).
					aria-label={ __( 'Back to dashboard', 'google-site-kit' ) }
					onClick={ onClick }
					text
				>
					{ __( 'Back to dashboard', 'google-site-kit' ) }
				</Button>
			</div>

			<div className="googlesitekit-entity-header__details">
				<p>{ currentEntityTitle }</p>
				<Link href={ entityURL } external inherit>
					{ url }
				</Link>
			</div>
		</div>
	);
};

export default EntityHeader;
