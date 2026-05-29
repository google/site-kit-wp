/**
 * Site Goals Selection Panel exports.
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
import { useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import SelectionPanel from '@/js/components/SelectionPanel';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import useFormValue from '@/js/hooks/useFormValue';
import {
	SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
	SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_EFFECTIVE_DRIVERS,
	SITE_GOALS_EFFECTIVE_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTION_FORM,
	SITE_GOALS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GoalDriverSelectionState,
	resolveGoalDriverSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import CustomDimensionsNotice from '@/js/modules/analytics-4/components/site-goals/selection-panel/CustomDimensionsNotice';
import Footer from '@/js/modules/analytics-4/components/site-goals/selection-panel/Footer';
import Header from '@/js/modules/analytics-4/components/site-goals/selection-panel/Header';
import PanelContent from '@/js/modules/analytics-4/components/site-goals/selection-panel/PanelContent';
import SaveErrorNotice from '@/js/modules/analytics-4/components/site-goals/selection-panel/SaveErrorNotice';
import { resolveVisitorEngagementSelectionState } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';

const SiteGoalsSelectionPanel: FC = () => {
	const isOpen = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY ),
		[]
	);

	const hasEcommerceGoalDrivers = useSelect(
		( select: Select ) =>
			select(
				MODULES_ANALYTICS_4
			).hasEcommerceConversionReportingEvents(),
		[]
	);
	const hasLeadGoalDrivers = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasLeadConversionReportingEvents(),
		[]
	);

	const [ effectiveDrivers ] = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_EFFECTIVE_DRIVERS
	);
	const [ effectiveVisitorEngagement ] = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_EFFECTIVE_VISITOR_ENGAGEMENT
	);
	const [ isCustomDimensionsAutoSubmit ] = useFormValue(
		FORM_CUSTOM_DIMENSIONS_CREATE,
		'autoSubmit'
	);
	const [ customDimensionsForAutoSubmit ] = useFormValue(
		FORM_CUSTOM_DIMENSIONS_CREATE,
		'customDimensions'
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { setValue } = useDispatch( CORE_UI );

	const effectiveDriversRef = useRef( effectiveDrivers );
	const effectiveVisitorEngagementRef = useRef( effectiveVisitorEngagement );
	const isCustomDimensionsAutoSubmitRef = useRef(
		isCustomDimensionsAutoSubmit
	);
	const customDimensionsForAutoSubmitRef = useRef(
		customDimensionsForAutoSubmit
	);

	effectiveDriversRef.current = effectiveDrivers;
	effectiveVisitorEngagementRef.current = effectiveVisitorEngagement;
	isCustomDimensionsAutoSubmitRef.current = isCustomDimensionsAutoSubmit;
	customDimensionsForAutoSubmitRef.current = customDimensionsForAutoSubmit;

	const onSideSheetOpen = useCallback( () => {
		const isRestoringExplicitCustomDimensionsSetup =
			isCustomDimensionsAutoSubmitRef.current &&
			Array.isArray( customDimensionsForAutoSubmitRef.current ) &&
			customDimensionsForAutoSubmitRef.current.length > 0;

		if ( isRestoringExplicitCustomDimensionsSetup ) {
			return;
		}

		const normalizedEffectiveDrivers = resolveGoalDriverSelectionState(
			( effectiveDriversRef.current as
				| GoalDriverSelectionState
				| undefined ) || SITE_GOALS_DEFAULT_SELECTED_DRIVERS
		);
		const normalizedEffectiveVisitorEngagement =
			resolveVisitorEngagementSelectionState(
				effectiveVisitorEngagementRef.current ||
					SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT
			);

		setValues( SITE_GOALS_SELECTION_FORM, {
			[ SITE_GOALS_SELECTED_DRIVERS ]: normalizedEffectiveDrivers,
			[ SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT ]:
				normalizedEffectiveVisitorEngagement,
		} );
	}, [ setValues ] );

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			setValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY, false );
		}
	}, [ isOpen, setValue ] );

	return (
		<SelectionPanel
			className="googlesitekit-site-goals-selection-panel"
			isOpen={ isOpen }
			closePanel={ closePanel }
			onOpen={ onSideSheetOpen }
		>
			<Header closePanel={ closePanel } />
			<PanelContent
				hasEcommerceGoalDrivers={ !! hasEcommerceGoalDrivers }
				hasLeadGoalDrivers={ !! hasLeadGoalDrivers }
			/>
			<div className="googlesitekit-site-goals-selection-panel__footer-container">
				<SaveErrorNotice
					hasEcommerceGoalDrivers={ !! hasEcommerceGoalDrivers }
					hasLeadGoalDrivers={ !! hasLeadGoalDrivers }
				/>
				<CustomDimensionsNotice />
				<Footer
					isOpen={ !! isOpen }
					closePanel={ closePanel }
					hasEcommerceGoalDrivers={ !! hasEcommerceGoalDrivers }
					hasLeadGoalDrivers={ !! hasLeadGoalDrivers }
				/>
			</div>
		</SelectionPanel>
	);
};

export default SiteGoalsSelectionPanel;
