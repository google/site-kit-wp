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
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import IntroModalEcommerceAndLead from './IntroModalEcommerceAndLead';
import IntroModalEcommerce from './IntroModalEcommerce';
import IntroModalLead from './IntroModalLead';

export const SITE_GOALS_INTRO_MODAL_BANNER = 'site_goals_intro_modal_banner';

export interface IntroModalVariantProps {
	onClose: () => void;
}

export default function IntroModal() {
	const [ isOpen, setIsOpen ] = useState( true );

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

	const handleClose = useCallback( () => {
		setIsOpen( false );
	}, [] );

	if (
		hasEcommerceConversionReportingEvents === undefined ||
		hasLeadConversionReportingEvents === undefined ||
		! isOpen
	) {
		return null;
	}

	if (
		hasEcommerceConversionReportingEvents &&
		hasLeadConversionReportingEvents
	) {
		return <IntroModalEcommerceAndLead onClose={ handleClose } />;
	}

	if ( hasEcommerceConversionReportingEvents ) {
		return <IntroModalEcommerce onClose={ handleClose } />;
	}

	if ( hasLeadConversionReportingEvents ) {
		return <IntroModalLead onClose={ handleClose } />;
	}

	return null;
}
