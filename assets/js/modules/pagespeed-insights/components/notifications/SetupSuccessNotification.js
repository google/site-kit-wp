/**
 * SetupSuccessNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import SubtleNotification from '../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import CTALinkSubtle from '../../../../googlesitekit/notifications/components/common/CTALinkSubtle';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';
import useQueryArg from '../../../../hooks/useQueryArg';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';
import { getNavigationalScrollTop } from '../../../../util/scroll';
import { ANCHOR_ID_SPEED } from '../../../../googlesitekit/constants';

export default function SetupSuccessNotification( { id, Notification } ) {
	const breakpoint = useBreakpoint();

	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ , setSlug ] = useQueryArg( 'slug' );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	const anchorLink = `#${ ANCHOR_ID_SPEED }`;
	const onJumpLinkClick = ( event ) => {
		event.preventDefault();

		dismissNotification( id );
		onDismiss();

		global.history.replaceState( {}, '', anchorLink );
		global.scrollTo( {
			top: getNavigationalScrollTop( anchorLink, breakpoint ),
			behavior: 'smooth',
		} );
	};

	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'Congrats on completing the setup for PageSpeed Insights!',
					'google-site-kit'
				) }
				description={ __(
					'Jump to the bottom of the dashboard to see how fast your home page is',
					'google-site-kit'
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
						onDismiss={ onDismiss }
					/>
				}
				additionalCTA={
					<CTALinkSubtle
						id={ id }
						ctaLabel={ __( 'Show me', 'google-site-kit' ) }
						onCTAClick={ onJumpLinkClick }
					/>
				}
			/>
		</Notification>
	);
}

SetupSuccessNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
