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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS,
	SITE_GOALS_BREAKDOWN_LEAD_PROVIDER_LABELS,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

interface EventProviderDeactivatedNoticeProps {
	/** The goal type of the widget that renders the notice. */
	goalType: GoalType;
	/** The slug of the plugin that supplies the active tab's data, such as `woocommerce`. */
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

	const learnMoreURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL(
				'plugin-conversion-tracking'
			),
		[]
	) as string;

	// `getActiveConversionEventProviders()` is `undefined` until the site info
	// resolves. Reading `undefined` as an empty list would flash the notice for
	// a plugin that is still active.
	if ( ! providerSlug || activeConversionEventProviders === undefined ) {
		return null;
	}

	if ( activeConversionEventProviders.includes( providerSlug ) ) {
		return null;
	}

	const isEcommerce = goalType === GOAL_TYPES.ECOMMERCE;

	const providerLabels = isEcommerce
		? SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS
		: SITE_GOALS_BREAKDOWN_LEAD_PROVIDER_LABELS;

	// The label map holds every plugin this goal type's tabs can name. A slug it
	// leaves out names no plugin Site Goals knows, so the notice stays silent.
	if ( ! providerLabels[ providerSlug ] ) {
		return null;
	}

	const learnMore = (
		<Link href={ learnMoreURL } external hideExternalIndicator />
	);

	const title = isEcommerce
		? __( 'Online store plugin no longer found', 'google-site-kit' )
		: __( 'Form plugin no longer found', 'google-site-kit' );

	const description = isEcommerce
		? createInterpolateElement(
				__(
					'Site Kit can no longer find the plugin used to track your online store, which means the data in this section is no longer updating. If you’ve stopped using that plugin, it will automatically be removed from this section soon. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMore }
		  )
		: createInterpolateElement(
				__(
					'Site Kit can no longer find the plugin used to track your forms, which means the form data in this section is no longer updating. If you’ve stopped using that plugin, this form will automatically be removed from this section. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMore }
		  );

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
