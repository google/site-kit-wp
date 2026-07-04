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
import { useDispatch } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { SITE_GOALS_BREAKDOWN_NOTICE } from '@/js/modules/analytics-4/components/site-goals/constants';

interface BreakdownNoticeProps {
	title: ReactNode;
	description: ReactNode;
	ctaLabel: string;
	onCTAClick: () => void;
	className?: string;
	ctaInProgress?: boolean;
	ctaDisabled?: boolean;
	onDismissComplete?: () => void;
}

const BreakdownNotice: FC< BreakdownNoticeProps > = ( {
	title,
	description,
	ctaLabel,
	onCTAClick,
	className,
	ctaInProgress,
	ctaDisabled,
	onDismissComplete,
} ) => {
	const { dismissItem } = useDispatch( CORE_USER );

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
				onClick: onCTAClick,
				inProgress: ctaInProgress,
				disabled: ctaDisabled,
			} }
			dismissButton={ {
				label: __( 'No thanks', 'google-site-kit' ),
				onClick: handleDismiss,
			} }
		/>
	);
};

export default BreakdownNotice;
