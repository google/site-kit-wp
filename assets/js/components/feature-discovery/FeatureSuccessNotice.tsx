/**
 * FeatureSuccessNotice component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { FEATURE_SETUP_SUCCESS_NOTIFICATION_EVENT_ID } from '@/js/components/feature-discovery/constants';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureSuccessNotice as FeatureSuccessNoticeSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

interface FeatureSuccessNoticeProps {
	slug: string;
	onDismiss: () => void;
	trackViewEvent?: boolean;
}

const FeatureSuccessNotice: FC< FeatureSuccessNoticeProps > = ( {
	slug,
	onDismiss,
	trackViewEvent = true,
} ) => {
	const trackEvents = useNotificationEvents(
		FEATURE_SETUP_SUCCESS_NOTIFICATION_EVENT_ID
	);

	const successNotice = useSelect(
		( select: Select ): FeatureSuccessNoticeSettings | undefined =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug )?.successNotice,
		[ slug ]
	);

	const cta = successNotice?.cta;

	const ctaURL = useSelect(
		( select: Select ) => cta?.getURL?.( select ),
		[ cta ]
	);

	const onClickCTA = useCallback( () => {
		trackEvents.confirm( slug );
		cta?.onClick?.();
	}, [ trackEvents, slug, cta ] );

	const onClickDismiss = useCallback( () => {
		trackEvents.dismiss( slug );
		onDismiss();
	}, [ trackEvents, slug, onDismiss ] );

	const onInView = useCallback( () => {
		if ( trackViewEvent ) {
			trackEvents.view( slug );
		}
	}, [ trackEvents, trackViewEvent, slug ] );

	if ( ! successNotice ) {
		return null;
	}

	const { title, description, dismissLabel } = successNotice;

	return (
		<NoticeWithIntersectionObserver
			className="googlesitekit-feature-success-notice"
			type={ NOTICE_TYPES.SUCCESS }
			title={ title }
			description={ description }
			ctaButton={
				cta
					? {
							label: cta.label,
							onClick: onClickCTA,
							href: ctaURL,
							external: cta.external,
					  }
					: undefined
			}
			dismissButton={ {
				label: dismissLabel || __( 'Got it', 'google-site-kit' ),
				onClick: onClickDismiss,
			} }
			onInView={ onInView }
		/>
	);
};

export default FeatureSuccessNotice;
