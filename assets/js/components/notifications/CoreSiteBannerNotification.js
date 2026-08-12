/**
 * CoreSiteBannerNotification component.
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
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import NotificationFromServer from '@/js/components/NotificationFromServer';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { HOUR_IN_SECONDS } from '@/js/util';

function CoreSiteBannerNotification( { id, ctaURL, ctaTarget, ...props } ) {
	const [ inProgress, setInProgress ] = useState( false );

	const { dismissNotification, acceptNotification } =
		useDispatch( CORE_SITE );

	const { dismissNotification: dismissFromQueue } =
		useDispatch( CORE_NOTIFICATIONS );

	const onCTAClick = useCallback(
		async ( event ) => {
			// If `ctaURL` is present, the CTA is rendered as a link with `href`,
			// which navigates immediately on click. Prevent that so we can mark the
			// notification as accepted and dismiss it from the queue before
			// navigating manually below.
			if ( ctaURL ) {
				event.preventDefault();
			}

			setInProgress( true );
			const { error } = await acceptNotification( id );

			if ( ! error ) {
				// Dismiss here rather than via `dismissOnClick` on the CTA in
				// `NotificationFromServer` > `BannerNotification`, because
				// `BannerNotification` runs `dismissOnClick` only after `onClick`
				// completes—and this handler navigates at the end of `onClick`.
				await dismissFromQueue( id, {
					expiresInSeconds: HOUR_IN_SECONDS,
				} );
			}

			setInProgress( false );

			if ( error || ! ctaURL ) {
				return;
			}

			if ( ctaTarget === '_blank' ) {
				window.open( ctaURL, '_blank' );
				return;
			}

			window.location.assign( ctaURL );
		},
		[ id, acceptNotification, dismissFromQueue, ctaURL, ctaTarget ]
	);

	const onDismissClick = useCallback( async () => {
		await dismissNotification( id );
	}, [ id, dismissNotification ] );

	return (
		<NotificationFromServer
			onCTAClick={ onCTAClick }
			onDismissClick={ onDismissClick }
			ctaInProgress={ inProgress }
			{ ...props }
			id={ id }
			ctaURL={ ctaURL }
			ctaTarget={ ctaTarget }
		/>
	);
}

CoreSiteBannerNotification.propTypes = {
	content: PropTypes.string,
	ctaLabel: PropTypes.string,
	ctaTarget: PropTypes.string,
	ctaURL: PropTypes.string,
	dismissLabel: PropTypes.string,
	dismissible: PropTypes.bool,
	gaTrackingEventArgs: PropTypes.object,
	id: PropTypes.string.isRequired,
	learnMoreLabel: PropTypes.string,
	learnMoreURL: PropTypes.string,
	title: PropTypes.string.isRequired,
};

CoreSiteBannerNotification.defaultProps = {
	content: '',
	ctaLabel: '',
	ctaTarget: '',
	ctaURL: '',
	dismissLabel: __( 'OK, Got it!', 'google-site-kit' ),
	dismissible: true,
	learnMoreLabel: '',
	learnMoreURL: '',
};

export default CoreSiteBannerNotification;
