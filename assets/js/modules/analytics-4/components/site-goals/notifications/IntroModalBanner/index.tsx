/**
 * IntroModal component.
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
import { ElementType } from 'react';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { ANCHOR_ID_SITE_GOALS } from '@/js/googlesitekit/constants';
import {
	ACTIVE_CONTEXT_ID,
	CORE_UI,
} from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { getSiteGoalsTour } from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { useSiteGoalsSectionReady } from '@/js/modules/analytics-4/hooks/useSiteGoalsSectionReady';
import { getNavigationalScrollTop } from '@/js/util/scroll';
import IntroModalEcommerce from './IntroModalEcommerce';
import IntroModalEcommerceAndLead from './IntroModalEcommerceAndLead';
import IntroModalLead from './IntroModalLead';
import { IntroModalVariantProps } from './types';

export const SITE_GOALS_INTRO_MODAL_BANNER = 'site-goals-intro-modal-banner';
/**
 * Dismissed-item slug that the Site Goals intro modal saves when the user
 * clicks "Show me". Closing the modal any other way saves only
 * `SITE_GOALS_INTRO_MODAL_BANNER`, so the survey triggers compare the two
 * slugs to tell a user who confirmed the modal from one who dismissed it.
 */
export const SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED =
	'site-goals-intro-modal-banner-confirmed';

export const INTRO_MODAL_VARIANTS = {
	ECOMMERCE: 'ecommerce',
	LEAD: 'lead',
	ECOMMERCE_AND_LEAD: 'ecommerce_lead',
} as const;

type IntroModalVariantLabel =
	typeof INTRO_MODAL_VARIANTS[ keyof typeof INTRO_MODAL_VARIANTS ];

interface IntroModalTrackingEvents {
	confirm: ( label: IntroModalVariantLabel ) => void;
	clickLearnMore: ( label: IntroModalVariantLabel ) => void;
	dismiss: ( label: IntroModalVariantLabel ) => void;
}

function createModalHandlers(
	label: IntroModalVariantLabel,
	onClose: () => void,
	trackEvent: IntroModalTrackingEvents,
	onShowMeCTAClicked: () => void
): IntroModalVariantProps {
	return {
		onConfirm: () => {
			trackEvent.confirm( label );
			// The "Show me" path saves its dismissed items inside
			// `onShowMeCTAClicked`, so don't also call `onClose`. A second
			// save running in parallel can drop one of the dismissed items.
			onShowMeCTAClicked();
		},
		onClickLearnMore: () => {
			trackEvent.clickLearnMore( label );
		},
		onDismiss: () => {
			trackEvent.dismiss( label );
			onClose();
		},
	};
}

interface IntroModalProps {
	id: string;
	Notification: ElementType;
}

export default function IntroModal( { id, Notification }: IntroModalProps ) {
	const { dismissItem, triggerOnDemandTour } = useDispatch( CORE_USER );
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );
	const { setValue } = useDispatch( CORE_UI );

	const breakpoint = useBreakpoint();

	const trackEvent = useNotificationEvents(
		SITE_GOALS_INTRO_MODAL_BANNER
	) as IntroModalTrackingEvents;

	const hasEcommerceConversionReportingEvents = useSelect(
		( select: Select ) =>
			select(
				MODULES_ANALYTICS_4
			).hasEcommerceConversionReportingEvents(),
		[]
	);

	const hasLeadConversionReportingEvents = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasLeadConversionReportingEvents(),
		[]
	);

	const hasEcommerceConversionReportingEventsOnly = useSelect(
		( select: Select ) =>
			select(
				MODULES_ANALYTICS_4
			).hasEcommerceConversionReportingEventsOnly(),
		[]
	);

	const hasBreakdownDimensions = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS
			),
		[]
	);
	const isBreakdownNoticeDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed( SITE_GOALS_BREAKDOWN_NOTICE ),
		[]
	);

	const hasInsufficientAnalyticsAccess = useSelect( ( select: Select ) => {
		// Skip the access check for view-only users. The check only works
		// for signed-in users. The shared dashboard already limits this
		// modal to roles that can view Analytics.
		if ( ! select( CORE_USER ).isAuthenticated() ) {
			return false;
		}

		const hasAccess = select( CORE_MODULES ).hasModuleAccess(
			MODULE_SLUG_ANALYTICS_4
		);

		// While the access check is still loading, the modal stays hidden.
		// It only appears after the check returns `true`.
		return hasAccess !== true;
	}, [] );

	// All the checks the modal needs, apart from the section being ready.
	// It needs at least one detected event type. If there is none, the
	// modal never shows, so the hook below should not load the widget
	// areas or wait.
	//
	// The dismissed-item check is intentionally omitted here: `isDismissible`
	// on the notification registration keeps the framework from mounting this
	// component while the modal is dismissed.
	const canShowSiteGoalsIntroModal =
		hasEcommerceConversionReportingEvents !== undefined &&
		hasLeadConversionReportingEvents !== undefined &&
		( hasEcommerceConversionReportingEvents ||
			hasLeadConversionReportingEvents ) &&
		! hasInsufficientAnalyticsAccess;

	// While the modal can show, the hook loads the widget areas above and
	// including the Site Goals section, and reports ready once the section
	// has loaded and its layout has settled.
	const isSiteGoalsSectionReady = useSiteGoalsSectionReady(
		canShowSiteGoalsIntroModal
	);

	function handleClose() {
		dismissNotification( id );
	}

	// Save the confirmed slug before the shared slug. Each save replaces the
	// whole dismissed-items list with the server's copy, so two in parallel
	// can overwrite each other and drop a slug. A dropped confirmed slug
	// makes the survey triggers read the wrong segment.
	async function dismissConfirmedThenShared() {
		await dismissItem( SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED );
		dismissNotification( id );
	}

	function handleShowMe() {
		dismissConfirmedThenShared();

		triggerOnDemandTour(
			getSiteGoalsTour( {
				isEcommerceOnly: !! hasEcommerceConversionReportingEventsOnly,
				// "Show me" dismisses the intro modal, so the breakdown notice
				// will render if its dimensions are still missing and it has
				// not been dismissed. Mirrors the BreakdownNotice gating.
				hasBreakdownNotice:
					hasBreakdownDimensions === false &&
					! isBreakdownNoticeDismissed,
			} )
		);

		// Go to the Site Goals section the same way the navigation chip
		// does. Set the URL hash, set the section as the active context,
		// and scroll to the section anchor. The active context makes the
		// Site Goals widgets load right away, so the tour finds its first
		// target. From here the navigation's scroll tracking updates the
		// hash and the active context.
		global.history.replaceState( {}, '', `#${ ANCHOR_ID_SITE_GOALS }` );

		setValue( ACTIVE_CONTEXT_ID, ANCHOR_ID_SITE_GOALS );

		global.scrollTo( {
			top: getNavigationalScrollTop(
				`#${ ANCHOR_ID_SITE_GOALS }`,
				breakpoint
			),
			behavior: 'smooth',
		} );
	}

	if ( ! canShowSiteGoalsIntroModal || ! isSiteGoalsSectionReady ) {
		return null;
	}

	const ecommerceHandlers = createModalHandlers(
		INTRO_MODAL_VARIANTS.ECOMMERCE,
		handleClose,
		trackEvent,
		handleShowMe
	);
	const leadHandlers = createModalHandlers(
		INTRO_MODAL_VARIANTS.LEAD,
		handleClose,
		trackEvent,
		handleShowMe
	);
	const ecommerceAndLeadHandlers = createModalHandlers(
		INTRO_MODAL_VARIANTS.ECOMMERCE_AND_LEAD,
		handleClose,
		trackEvent,
		handleShowMe
	);

	if (
		hasEcommerceConversionReportingEvents &&
		hasLeadConversionReportingEvents
	) {
		return (
			<Notification
				gaTrackingEventArgs={ {
					label: INTRO_MODAL_VARIANTS.ECOMMERCE_AND_LEAD,
				} }
			>
				<IntroModalEcommerceAndLead { ...ecommerceAndLeadHandlers } />
			</Notification>
		);
	}

	if ( hasEcommerceConversionReportingEvents ) {
		return (
			<Notification
				gaTrackingEventArgs={ {
					label: INTRO_MODAL_VARIANTS.ECOMMERCE,
				} }
			>
				<IntroModalEcommerce { ...ecommerceHandlers } />
			</Notification>
		);
	}

	if ( hasLeadConversionReportingEvents ) {
		return (
			<Notification
				gaTrackingEventArgs={ {
					label: INTRO_MODAL_VARIANTS.LEAD,
				} }
			>
				<IntroModalLead { ...leadHandlers } />
			</Notification>
		);
	}

	return null;
}
