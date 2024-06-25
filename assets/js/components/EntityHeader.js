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
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import BackspaceIcon from '../../svg/icons/keyboard-backspace.svg';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import Link from './Link';
import { shortenURL } from '../util/urls';
import { trackEvent } from '../util';
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
} from '../hooks/useDashboardType';
import useViewContext from '../hooks/useViewContext';

function EntityHeader() {
	const viewContext = useViewContext();
	const dashboardType = useDashboardType();
	const currentEntityTitle = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityTitle()
	);
	const entityURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const headerDetailsRef = useRef();
	const [ url, setURL ] = useState( entityURL );

	useEffect( () => {
		const shortenEntityURL = () => {
			if ( ! headerDetailsRef.current ) {
				return;
			}

			// Remove 40 px for margins + SVG at the end of the URL link.
			const availableWidth = headerDetailsRef.current.clientWidth - 40;

			const urlFontSize = global
				.getComputedStyle( headerDetailsRef.current.lastChild, null )
				.getPropertyValue( 'font-size' );
			const fontSize = parseFloat( urlFontSize );

			// 2 is appox. the minimum character constant for sans-serif fonts:
			// https://pearsonified.com/characters-per-line/
			const maxChars = ( availableWidth * 2 ) / fontSize;

			setURL( shortenURL( entityURL, maxChars ) );
		};

		// Use throttled version only on window resize.
		const throttledShortenURL = throttle( shortenEntityURL, 100 );

		shortenEntityURL();

		global.addEventListener( 'resize', throttledShortenURL );
		return () => {
			global.removeEventListener( 'resize', throttledShortenURL );
		};
	}, [ entityURL, headerDetailsRef, setURL ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const returnURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const onClick = useCallback( () => {
		trackEvent( `${ viewContext }_navigation`, 'return_to_dashboard' );
		navigateTo( returnURL );
	}, [ returnURL, navigateTo, viewContext ] );

	if (
		DASHBOARD_TYPE_ENTITY !== dashboardType ||
		entityURL === null ||
		currentEntityTitle === null
	) {
		return null;
	}

	return (
		<div className="googlesitekit-entity-header">
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
					tertiary
				>
					{ __( 'Back to dashboard', 'google-site-kit' ) }
				</Button>
			</div>

			<div
				ref={ headerDetailsRef }
				className="googlesitekit-entity-header__details"
			>
				<p>{ currentEntityTitle }</p>
				<Link
					secondary
					href={ entityURL }
					aria-label={ entityURL }
					external
				>
					{ url }
				</Link>
			</div>
		</div>
	);
}

export default EntityHeader;
