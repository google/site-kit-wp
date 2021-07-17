/**
 * DashboardCTA component.
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

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import Button from '../../../../components/Button';
import Link from '../../../../components/Link';
import IdeaHubIcon from '../../../../../svg/idea-hub.svg';
import BulbIcon from '../../../../../svg/bulb.svg';
import CloseIcon from '../../../../../svg/close.svg';
const { useSelect, useDispatch } = Data;

const DISMISS_ITEM_IDEA_HUB_CTA = 'idea-hub-cta';

function DashboardCTA( { Widget } ) {
	const { connected, active } = useSelect( ( select ) => select( CORE_MODULES ).getModule( 'idea-hub' ) );
	const dismissed = useSelect( ( select ) => select( CORE_USER ).isItemDismissed( DISMISS_ITEM_IDEA_HUB_CTA ) );

	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setInternalServerError } = useDispatch( CORE_SITE );
	const { dismissItem } = useDispatch( CORE_USER );

	const onClick = useCallback( async () => {
		const { error, response } = await activateModule( 'idea-hub' );

		if ( ! error ) {
			navigateTo( response.moduleReauthURL );
		} else {
			setInternalServerError( {
				id: 'idea-hub-setup-error',
				description: error.message,
			} );
		}
	}, [ activateModule, navigateTo, setInternalServerError ] );

	const onDismiss = useCallback( async () => {
		await dismissItem( DISMISS_ITEM_IDEA_HUB_CTA );
	}, [ dismissItem ] );

	// Don't render this component if it has been dismissed or dismissed items aren't loaded yet.
	if ( dismissed || dismissed === undefined ) {
		return null;
	}

	return (
		<Widget>
			<div className="googlesitekit-idea-hub__dashboard-cta">
				<div className="googlesitekit-idea-hub__dashboard-cta__icon">
					<IdeaHubIcon height="144" width="144" />
				</div>

				<div className="googlesitekit-idea-hub__dashboard-cta__content">
					<h5>
						{ __( 'Get new topics based on what people are searching for with Idea Hub', 'google-site-kit' ) }
					</h5>

					<p className="googlesitekit-idea-hub__dashboard-cta__learnmore-copy">
						<BulbIcon
							width="16"
							height="16"
						/>
						&nbsp;
						<Link
							className="googlesitekit-idea-hub__dashboard-cta__learnmore"
							href="https://sitekit.withgoogle.com/documentation/idea-hub-module/"
							external
							inherit
							hideExternalIndicator
						>
							{ __( 'Learn more', 'google-site-kit' ) }
						</Link>
					</p>

					<Button onClick={ onClick }>
						{
							active && ! connected
								? __( 'Complete set up', 'google-site-kit' )
								: __( 'Set up', 'google-site-kit' )
						}
					</Button>
				</div>

				<Button
					className="googlesitekit-idea-hub__dashboard-cta__close-button"
					icon={ <CloseIcon width="14" height="14" /> }
					text
					onClick={ onDismiss }
				/>
			</div>
		</Widget>
	);
}

DashboardCTA.propTypes = {
	Widget: PropTypes.func.isRequired,
};

export default DashboardCTA;
