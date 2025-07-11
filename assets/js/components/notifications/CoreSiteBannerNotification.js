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
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import BannerNotification, {
	TYPES,
} from '../../googlesitekit/notifications/components/layout/BannerNotification';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import useViewContext from '../../hooks/useViewContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { getStickyHeaderHeightWithoutNav } from '../../util/scroll';
import { finiteNumberOrZero } from '../../util/finite-number-or-zero';
import useNotificationEvents from '../../googlesitekit/notifications/hooks/useNotificationEvents';

function CoreSiteBannerNotification( {
	content,
	ctaLabel,
	ctaTarget,
	ctaURL,
	dismissLabel,
	dismissible,
	id,
	learnMoreLabel,
	learnMoreURL,
	title,
} ) {
	const trackEvents = useNotificationEvents( id );

	const { dismissNotification, acceptNotification } =
		useDispatch( CORE_SITE );

	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();

	// Intersection observer for tracking view event.
	const [ isViewed, setIsViewed ] = useState( false );
	const bannerNotificationRef = useRef();
	const intersectionEntry = useIntersection( bannerNotificationRef, {
		rootMargin: `${ -finiteNumberOrZero(
			getStickyHeaderHeightWithoutNav( breakpoint )
		) }px 0px 0px 0px`,
		threshold: 0,
	} );

	useEffect( () => {
		if ( ! isViewed && intersectionEntry?.isIntersecting ) {
			trackEvents.view();
			setIsViewed( true );
		}
	}, [ viewContext, isViewed, intersectionEntry, trackEvents ] );

	const onCTAClick = useCallback( () => {
		acceptNotification( id );
	}, [ id, acceptNotification ] );

	const onDismissClick = useCallback( () => {
		dismissNotification( id );
	}, [ id, dismissNotification ] );

	return (
		<div ref={ bannerNotificationRef }>
			<BannerNotification
				notificationID={ id }
				type={ TYPES.WARNING }
				title={ title }
				description={ content }
				learnMoreLink={ {
					label: learnMoreLabel,
					href: learnMoreURL,
				} }
				ctaButton={ {
					label: ctaLabel,
					href: ctaURL,
					target: ctaTarget,
					onClick: onCTAClick,
				} }
				dismissButton={
					dismissible
						? {
								label: dismissLabel,
								onClick: onDismissClick,
						  }
						: undefined
				}
			/>
		</div>
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
