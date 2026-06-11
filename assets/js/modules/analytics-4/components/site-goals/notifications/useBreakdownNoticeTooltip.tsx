/**
 * Site Goals breakdown notice tooltip hook.
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
 * WordPress dependencies
 */
import { createInterpolateElement, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { SITE_GOALS_BREAKDOWN_NOTICE } from '@/js/modules/analytics-4/components/site-goals/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

/**
 * Returns the `showTooltip` callback for the shared breakdown notice tooltip.
 *
 * The tooltip is triggered by the notice's parents, not the notice itself: the
 * widgets show it immediately on dismiss, while the Side Panel defers it until
 * the panel overlay has closed. Keeping it here means the tooltip slug, copy and
 * dismiss label live in a single place shared by all of them.
 *
 * @since 1.181.0
 *
 * @return {Function} The `showTooltip` callback.
 */
export function useBreakdownNoticeTooltip() {
	const analyticsSettingsURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getModuleSettingsURL( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);

	const tooltipSettings = useMemo(
		() => ( {
			tooltipSlug: SITE_GOALS_BREAKDOWN_NOTICE,
			title: __(
				'You can always enable breakdown from settings later',
				'google-site-kit'
			),
			content: createInterpolateElement(
				__(
					'Enable “Advanced data breakdowns” from <a>Analytics settings</a> to start collecting breakdown data.',
					'google-site-kit'
				),
				{
					a: <Link href={ analyticsSettingsURL } />,
				}
			),
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		} ),
		[ analyticsSettingsURL ]
	);

	return useShowTooltip( tooltipSettings );
}
