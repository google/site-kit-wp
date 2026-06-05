/**
 * Site Goals breakdown notice.
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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

interface BreakdownNoticeProps {
	title: ReactNode;
	description: ReactNode;
	ctaLabel: string;
	className?: string;
	onDismissComplete?: () => void;
}

const BreakdownNotice: FC< BreakdownNoticeProps > = ( {
	title,
	description,
	ctaLabel,
	className,
	onDismissComplete,
} ) => {
	const isIntroModalDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				SITE_GOALS_INTRO_MODAL_BANNER
			),
		[]
	);
	const hasBreakdownDimensions = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS
			),
		[]
	);
	const isNoticeDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed( SITE_GOALS_BREAKDOWN_NOTICE ),
		[]
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const isViewOnly = useViewOnly();

	if ( isViewOnly ) {
		return null;
	}

	// Avoid a flash while any of the gating selectors are still resolving.
	if (
		isIntroModalDismissed === undefined ||
		hasBreakdownDimensions === undefined ||
		isNoticeDismissed === undefined
	) {
		return null;
	}

	if (
		! isIntroModalDismissed ||
		hasBreakdownDimensions ||
		isNoticeDismissed
	) {
		return null;
	}

	async function handleDismiss() {
		// Wait for the dismissal to persist (which hides the notice) before
		// triggering the tooltip, so they don't briefly overlap.
		await dismissItem( SITE_GOALS_BREAKDOWN_NOTICE );
		onDismissComplete?.();
	}

	return (
		<Notice
			className={ className }
			type={ NOTICE_TYPES.NEW }
			title={ title }
			description={ description }
			ctaButton={ {
				label: ctaLabel,
				// TODO: Trigger the breakdown setup flow (OAuth + custom
				// dimension creation) in #12801.
				onClick: () => {},
			} }
			dismissButton={ {
				label: __( 'No thanks', 'google-site-kit' ),
				onClick: handleDismiss,
			} }
		/>
	);
};

export default BreakdownNotice;
