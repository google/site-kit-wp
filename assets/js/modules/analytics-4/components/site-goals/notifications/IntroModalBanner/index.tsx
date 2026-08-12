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
import { ElementType, FC } from 'react';

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
import { useHasBeenViewed } from '@/js/googlesitekit/notifications/hooks/useHasBeenViewed';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import { getSiteGoalsTour } from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { useSiteGoalsSectionReady } from '@/js/modules/analytics-4/hooks/useSiteGoalsSectionReady';
import { getNavigationalScrollTop } from '@/js/util/scroll';
import { hasGoalTypeBreakdownNotice } from './hasGoalTypeBreakdownNotice';
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
	onShowMeCTAClicked: () => void,
	onView: () => void
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
		onView,
	};
}

interface IntroModalProps {
	id: string;
	Notification: ElementType;
}

const IntroModal: FC< IntroModalProps > = ( { id, Notification } ) => {
	const { dismissItem, triggerOnDemandTour } = useDispatch( CORE_USER );
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );
	const { setValue } = useDispatch( CORE_UI );

	const breakpoint = useBreakpoint();

	const trackEvent = useNotificationEvents(
		SITE_GOALS_INTRO_MODAL_BANNER
	) as IntroModalTrackingEvents;

	// Whether each goal type's widget renders. The modal introduces those
	// widgets, so it follows the exact conditions they apply.
	const isEcommerceWidgetRenderable = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetRenderable(
				GOAL_TYPES.ECOMMERCE
			),
		[]
	);

	const isLeadWidgetRenderable = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetRenderable(
				GOAL_TYPES.LEAD
			),
		[]
	);

	// Read the notice per widget, so the tour's breakdown step knows which one
	// it lands on and takes that widget's copy.
	const hasEcommerceBreakdownNotice = useSelect(
		( select: Select ) =>
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE ),
		[]
	);
	const hasLeadBreakdownNotice = useSelect(
		( select: Select ) =>
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.LEAD ),
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
	// At least one Site Goals widget must render. If none does, the modal never
	// shows, so the hook below should not load the widget areas or wait.
	//
	// The dismissed-item check is intentionally omitted here: `isDismissible`
	// on the notification registration keeps the framework from mounting this
	// component while the modal is dismissed.
	const canShowSiteGoalsIntroModal =
		( isEcommerceWidgetRenderable === true ||
			isLeadWidgetRenderable === true ) &&
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

	// The modal content renders inside a fixed-position Dialog, which is taken
	// out of the flow of the `<Notification>` wrapper's `<section>`. That
	// leaves the section with no measurable area, so the framework's own
	// intersection observer never flips the notification to "viewed" and the
	// `view_notification` event never fires. `BannerModal` observes its own
	// visible content instead, so mark the notification viewed when the modal
	// comes into view, which is what makes `<Notification>` fire the view event.
	function handleView() {
		setValue( useHasBeenViewed.getKey( id ), true );
	}

	async function handleShowMe() {
		// Save the confirmed slug before the notification ID slug. Each save
		// replaces the whole dismissed-items list with the server's copy, so
		// two in parallel can overwrite each other and drop a slug. A dropped
		// confirmed slug makes the survey triggers read the wrong segment.
		await dismissItem( SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED );
		await dismissNotification( id );

		triggerOnDemandTour(
			getSiteGoalsTour( {
				hasEcommerceBreakdownNotice,
				hasLeadBreakdownNotice,
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
		handleShowMe,
		handleView
	);
	const leadHandlers = createModalHandlers(
		INTRO_MODAL_VARIANTS.LEAD,
		handleClose,
		trackEvent,
		handleShowMe,
		handleView
	);
	const ecommerceAndLeadHandlers = createModalHandlers(
		INTRO_MODAL_VARIANTS.ECOMMERCE_AND_LEAD,
		handleClose,
		trackEvent,
		handleShowMe,
		handleView
	);

	if ( isEcommerceWidgetRenderable && isLeadWidgetRenderable ) {
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

	if ( isEcommerceWidgetRenderable ) {
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

	if ( isLeadWidgetRenderable ) {
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
};

export default IntroModal;
