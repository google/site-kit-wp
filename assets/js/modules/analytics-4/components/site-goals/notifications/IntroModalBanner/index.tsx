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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { getSiteGoalsTour } from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import IntroModalEcommerce from './IntroModalEcommerce';
import IntroModalEcommerceAndLead from './IntroModalEcommerceAndLead';
import IntroModalLead from './IntroModalLead';
import { IntroModalVariantProps } from './types';

export const SITE_GOALS_INTRO_MODAL_BANNER = 'site_goals_intro_modal_banner';

export const INTRO_MODAL_VARIANTS = {
	ECOMMERCE: 'ecommerce',
	LEAD: 'lead',
	ECOMMERCE_AND_LEAD: 'ecommerce_lead',
} as const;

type IntroModalVariantLabel =
	typeof INTRO_MODAL_VARIANTS[ keyof typeof INTRO_MODAL_VARIANTS ];

interface IntroModalTrackingEvents {
	view: ( label: IntroModalVariantLabel ) => void;
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
		onView: () => {
			trackEvent.view( label );
		},
		onConfirm: () => {
			trackEvent.confirm( label );
			onClose();
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

export default function IntroModal() {
	const [ isOpen, setIsOpen ] = useState( true );

	const { dismissItem, triggerOnDemandTour } = useDispatch( CORE_USER );

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

	const isIntroModalDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				SITE_GOALS_INTRO_MODAL_BANNER
			),
		[]
	);

	function handleClose() {
		setIsOpen( false );
		dismissItem( SITE_GOALS_INTRO_MODAL_BANNER );
	}

	function handleShowMe() {
		triggerOnDemandTour(
			getSiteGoalsTour( {
				isEcommerceOnly: !! hasEcommerceConversionReportingEventsOnly,
			} )
		);
	}

	if (
		hasEcommerceConversionReportingEvents === undefined ||
		hasLeadConversionReportingEvents === undefined ||
		isIntroModalDismissed !== false ||
		! isOpen
	) {
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
		return <IntroModalEcommerceAndLead { ...ecommerceAndLeadHandlers } />;
	}

	if ( hasEcommerceConversionReportingEvents ) {
		return <IntroModalEcommerce { ...ecommerceHandlers } />;
	}

	if ( hasLeadConversionReportingEvents ) {
		return <IntroModalLead { ...leadHandlers } />;
	}

	return null;
}
