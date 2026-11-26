/**
 * Site Goals insight disclosure line.
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
import { AIDisclosure } from '@/js/modules/analytics-4/components/ai-insight';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { useSiteGoalsInsight } from '@/js/modules/analytics-4/components/site-goals/hooks/useSiteGoalsInsight';

interface InsightDisclosureProps {
	/** The goal type of the widget: `lead` or `ecommerce`. */
	goalType: GoalType;
	/** The open tab, an empty string for a widget without tabs, or `undefined` while it is not known yet. */
	tabID: string | undefined;
}

const InsightDisclosure: FC< InsightDisclosureProps > = ( {
	goalType,
	tabID,
} ) => {
	const insight = useSiteGoalsInsight( goalType, tabID );

	if ( ! insight ) {
		return null;
	}

	return <AIDisclosure />;
};

export default InsightDisclosure;
