/**
 * SiteGoalsSurveyTriggers component.
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
import SurveyViewTrigger from '@/js/components/surveys/SurveyViewTrigger';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
	SITE_GOALS_SURVEY_TRIGGER_BREAKDOWN_ENABLED,
	SITE_GOALS_SURVEY_TRIGGER_NON_INTERACTED,
	SITE_GOALS_SURVEY_TRIGGER_NO_BREAKDOWN,
} from './constants';
import { GOAL_TYPES } from './goal-drivers/constants';
import {
	SITE_GOALS_INTRO_MODAL_BANNER,
	SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED,
} from './notifications/IntroModalBanner';

const SiteGoalsSurveyTriggers: FC = () => {
	const isGA4Connected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);
	const isIntroModalDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				SITE_GOALS_INTRO_MODAL_BANNER
			),
		[]
	);
	const isIntroModalConfirmed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED
			),
		[]
	);
	// Whether each goal type's widget renders. Every segment below describes how
	// the user interacted with a Site Goals widget, so none of them applies when
	// no widget is on the page. Both reads are skipped until Analytics is
	// connected, for the same reason as the dimension check below.
	const isEcommerceWidgetRenderable = useSelect(
		( select: Select ) => {
			if ( ! isGA4Connected ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetRenderable(
				GOAL_TYPES.ECOMMERCE
			);
		},
		[ isGA4Connected ]
	);
	const isLeadWidgetRenderable = useSelect(
		( select: Select ) => {
			if ( ! isGA4Connected ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetRenderable(
				GOAL_TYPES.LEAD
			);
		},
		[ isGA4Connected ]
	);
	const hasBreakdownDimensions = useSelect(
		( select: Select ) => {
			// Skip the dimension check until Analytics is connected, so this
			// never requests Analytics data for a disconnected module.
			if ( ! isGA4Connected ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS
			);
		},
		[ isGA4Connected ]
	);

	// Render nothing until Analytics is connected. `isGA4Connected` is
	// `undefined` while loading and `false` when not connected.
	if ( ! isGA4Connected ) {
		return null;
	}

	// Wait for both widget checks, then render nothing when neither widget
	// renders. Both signals read below outlive the widgets: the breakdown custom
	// dimensions belong to the Analytics property and stay after an event
	// provider is deactivated, and the intro modal's dismissed items are
	// permanent. Without this, a dashboard with no Site Goals section keeps
	// reporting a segment.
	if (
		isEcommerceWidgetRenderable === undefined ||
		isLeadWidgetRenderable === undefined ||
		( ! isEcommerceWidgetRenderable && ! isLeadWidgetRenderable )
	) {
		return null;
	}

	// Wait for every signal to load, so it never reads incomplete state and
	// sends a trigger for the wrong segment.
	if (
		isIntroModalDismissed === undefined ||
		isIntroModalConfirmed === undefined ||
		hasBreakdownDimensions === undefined
	) {
		return null;
	}

	// The custom dimensions exist, so the breakdown is enabled. This is the
	// strongest engagement signal, so check it first.
	if ( hasBreakdownDimensions ) {
		return (
			<SurveyViewTrigger
				triggerID={ SITE_GOALS_SURVEY_TRIGGER_BREAKDOWN_ENABLED }
				ttl={ DAY_IN_SECONDS }
			/>
		);
	}

	// The user confirmed the intro modal with "Show me" but hasn't enabled
	// the breakdown. Confirming also saves `SITE_GOALS_INTRO_MODAL_BANNER`,
	// so a confirmed user looks dismissed too. Check this before the
	// non-interacted segment below.
	if ( isIntroModalConfirmed ) {
		return (
			<SurveyViewTrigger
				triggerID={ SITE_GOALS_SURVEY_TRIGGER_NO_BREAKDOWN }
				ttl={ DAY_IN_SECONDS }
			/>
		);
	}

	// The user dismissed the intro modal with "Maybe later" or the close
	// icon, without confirming it.
	if ( isIntroModalDismissed ) {
		return (
			<SurveyViewTrigger
				triggerID={ SITE_GOALS_SURVEY_TRIGGER_NON_INTERACTED }
				ttl={ DAY_IN_SECONDS }
			/>
		);
	}

	// The user hasn't seen the intro modal, so no segment applies.
	return null;
};

export default SiteGoalsSurveyTriggers;
