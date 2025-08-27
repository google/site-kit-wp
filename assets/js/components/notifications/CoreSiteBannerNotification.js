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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import NotificationFromServer from '@/js/components/NotificationFromServer';

function CoreSiteBannerNotification( { id, ...props } ) {
	const { dismissNotification, acceptNotification } =
		useDispatch( CORE_SITE );

	const onCTAClick = useCallback( () => {
		acceptNotification( id );
	}, [ id, acceptNotification ] );

	const onDismissClick = useCallback( () => {
		dismissNotification( id );
	}, [ id, dismissNotification ] );

	return (
		<NotificationFromServer
			onCTAClick={ onCTAClick }
			onDismissClick={ onDismissClick }
			{ ...props }
			id={ id }
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
