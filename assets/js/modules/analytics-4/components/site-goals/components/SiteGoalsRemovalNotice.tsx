/**
 * Site Goals removal notice.
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

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { trackEvent } from '@/js/util';
import { useSiteGoalsRemovalNoticeCopy } from './useSiteGoalsRemovalNoticeCopy';

export interface SiteGoalsRemovalNoticeProps {
	/** The goal type of the Site Goals widget (`'ecommerce'` or `'lead'`). */
	goalType: GoalType;
}

const SiteGoalsRemovalNotice: FC< SiteGoalsRemovalNoticeProps > = ( {
	goalType,
} ) => {
	const viewContext = useViewContext();
	const { title, description } = useSiteGoalsRemovalNoticeCopy( goalType );

	const isRemoving = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isRemovingSiteGoalsWidget(),
		[]
	) as boolean;

	const { removeSiteGoalsWidget } = useDispatch( MODULES_ANALYTICS_4 );

	const handleRemoveWidget = useCallback( () => {
		trackEvent(
			`${ viewContext }_site-goals-widget`,
			'remove_widget',
			goalType
		);

		removeSiteGoalsWidget( goalType );
	}, [ goalType, removeSiteGoalsWidget, viewContext ] );

	return (
		<Notice
			className="googlesitekit-site-goals-removal-notice"
			type={ NOTICE_TYPES.WARNING }
			title={ title }
			description={ description }
			dismissButton={ {
				onClick: handleRemoveWidget,
				disabled: isRemoving,
			} }
		/>
	);
};

export default SiteGoalsRemovalNotice;
