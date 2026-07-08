/**
 * AudienceSegmentationBackNotice component.
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
import type { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './AudienceSelectionPanel/constants';

export const AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG =
	'audience-segmentation-back-notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

interface AudienceSegmentationBackNoticeProps {
	Widget: ElementType;
}

const AudienceSegmentationBackNotice: FC<
	AudienceSegmentationBackNoticeProps
> = ( { Widget } ) => {
	const { dismissItem } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );
	const viewContext = useViewContext();

	const trackEventCategory = `${ viewContext }_audiences-reshown`;

	const onDismiss = useCallback( () => {
		trackEvent( trackEventCategory, 'dismiss_notice' );
		dismissItem( AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG );
	}, [ dismissItem, trackEventCategory ] );

	const onInView = useCallback( () => {
		trackEvent( trackEventCategory, 'view_notice' );
	}, [ trackEventCategory ] );

	const onSelectGroups = useCallback( () => {
		trackEvent( trackEventCategory, 'confirm_notice' );
		dismissItem( AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG );
		setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );
	}, [ dismissItem, setValue, trackEventCategory ] );

	return (
		<Widget noPadding>
			<NoticeWithIntersectionObserver
				type={ NOTICE_TYPES.INFO_CIRCLE }
				title={ __(
					'Visitor groups are back on your dashboard',
					'google-site-kit'
				) }
				description={ __(
					'This section is now an integral part of the dashboard. You can customize your visitor group selection at any time to compare how they interact with your site.',
					'google-site-kit'
				) }
				dismissButton={ {
					label: __( 'Got it', 'google-site-kit' ),
					onClick: onDismiss,
				} }
				ctaButton={ {
					label: __( 'Select groups', 'google-site-kit' ),
					onClick: onSelectGroups,
				} }
				onInView={ onInView }
			/>
		</Widget>
	);
};

export default AudienceSegmentationBackNotice;
