/**
 * Site Goals event provider deactivated notice.
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
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS,
	SITE_GOALS_BREAKDOWN_LEAD_PROVIDER_LABELS,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { useEventProviderDeactivatedNoticeCopy } from './useEventProviderDeactivatedNoticeCopy';

export interface EventProviderDeactivatedNoticeProps {
	/** The goal type of the widget that shows the notice. `GOAL_TYPES.ECOMMERCE` picks the online store wording and `GOAL_TYPES.LEAD` picks the form wording. */
	goalType: GoalType;
	/** The slug of the plugin whose data the active tab shows, such as `woocommerce` or `wpforms`. */
	providerSlug?: string;
}

const EventProviderDeactivatedNotice: FC<
	EventProviderDeactivatedNoticeProps
> = ( { goalType, providerSlug } ) => {
	const activeConversionEventProviders = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getActiveConversionEventProviders(),
		[]
	) as string[] | undefined;

	const { title, description } =
		useEventProviderDeactivatedNoticeCopy( goalType );

	if ( ! providerSlug || activeConversionEventProviders === undefined ) {
		return null;
	}

	if ( activeConversionEventProviders.includes( providerSlug ) ) {
		return null;
	}

	const providerLabel =
		goalType === GOAL_TYPES.ECOMMERCE
			? SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS[ providerSlug ]
			: SITE_GOALS_BREAKDOWN_LEAD_PROVIDER_LABELS[ providerSlug ];

	if ( ! providerLabel ) {
		return null;
	}

	return (
		<Notice
			className="googlesitekit-site-goals-event-provider-deactivated-notice"
			type={ NOTICE_TYPES.WARNING }
			title={ title }
			description={ description }
		/>
	);
};

export default EventProviderDeactivatedNotice;
