/**
 * EntityHeaderBanner component.
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
import { __, sprintf } from '@wordpress/i18n';
import {
	useContext,
	useCallback,
	createInterpolateElement,
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

const EntityHeaderBanner = () => {
	const viewContext = useContext( ViewContextContext );
	const currentEntityTitle = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityTitle()
	);
	const entityURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const returnURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const onClick = useCallback( () => {
		navigateTo( returnURL );
	}, [ returnURL, navigateTo ] );

	if (
		VIEW_CONTEXT_PAGE_DASHBOARD !== viewContext ||
		entityURL === null ||
		currentEntityTitle === null
	) {
		return null;
	}

	return (
		<div className="googlesitekit-entity-header-banner">
			<Button
				icon={ <BackspaceIcon width={ 24 } height={ 24 } /> }
				// This is duplicated because on small screens, the text supplied to the
				// Button is rendered as a sub-component and is set to `display: none`,
				// but the button itself remains on-screen (and thus this aria-label is
				// accessible to screen-readers).
				aria-label={ __( 'Return to dashboard', 'google-site-kit' ) }
				onClick={ onClick }
				className="googlesitekit-entity-header-banner__back"
				text
			>
				{ __( 'Return to dashboard', 'google-site-kit' ) }
			</Button>

			<div className="googlesitekit-entity-header-banner__details">
				<p>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: page title of the page whose stats we're showing */
							__(
								'<strong>Detailed page stats for:</strong> “%s”',
								'google-site-kit'
							),
							currentEntityTitle
						),
						{
							strong: <strong />,
						}
					) }
				</p>

				<Link href={ entityURL } external inherit>
					{ entityURL }
				</Link>
			</div>
		</div>
	);
};

export default EntityHeaderBanner;
