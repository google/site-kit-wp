/**
 * SettingsAdvancedDataBreakdowns component.
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
import {
	createInterpolateElement,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import useViewContext from '@/js/hooks/useViewContext';
import MeasurementSettingRow from '@/js/modules/analytics-4/components/common/MeasurementSettingRow';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	SITE_GOALS_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	isValidPropertyID,
	isValidPropertySelection,
} from '@/js/modules/analytics-4/utils/validation';
import { trackEvent } from '@/js/util';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';

export const ADVANCED_DATA_BREAKDOWNS_FORM = 'advancedDataBreakdownsForm';

interface SettingsAdvancedDataBreakdownsProps {
	hasModuleAccess?: boolean;
}

const SettingsAdvancedDataBreakdowns: FC<
	SettingsAdvancedDataBreakdownsProps
> = ( { hasModuleAccess = true } ) => {
	const propertyID = useSelect(
		( select: Select ) => select( MODULES_ANALYTICS_4 ).getPropertyID(),
		[]
	);

	const isAdvancedDataBreakdownsEnabled = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isAdvancedDataBreakdownsEnabled(
				propertyID
			),
		[ propertyID ]
	);

	/**
	 * Until the per-property map loads, the row stays in its loading state, so
	 * the Enable button can't save a partly loaded map and drop the other
	 * properties.
	 */
	const isSettingsLoaded = isAdvancedDataBreakdownsEnabled !== undefined;

	const hasAllCustomDimensions = useSelect(
		( select: Select ) => {
			// "Set up a new property" has no custom dimensions yet.
			if ( propertyID === PROPERTY_CREATE ) {
				return false;
			}

			// The selected property isn't known yet, for example right after an
			// account change, before a property is matched.
			if ( ! isValidPropertyID( propertyID ) ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).hasCustomDimensionsForProperty(
				propertyID,
				SITE_GOALS_CUSTOM_DIMENSIONS
			);
		},
		[ propertyID ]
	);

	/**
	 * The row's enabled state depends on the selected property's custom
	 * dimensions, so the row keeps loading until the selection is final and
	 * those dimensions resolve, like the Enhanced measurement switch above
	 * it. The "Set up a new property" selection has nothing to resolve.
	 */
	const isDimensionsLoaded = useSelect(
		( select: Select ) => {
			if (
				! isValidPropertySelection( propertyID ) ||
				select( MODULES_ANALYTICS_4 ).isLoadingPropertySummaries()
			) {
				return false;
			}

			if ( propertyID === PROPERTY_CREATE ) {
				return true;
			}

			return select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getCustomDimensions',
				[ propertyID ]
			);
		},
		[ propertyID ]
	);

	const hasEditScope = useSelect(
		( select: Select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ),
		[]
	);

	const supportURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getGoogleSupportURL( {
				path: '/analytics/answer/10075209',
			} ),
		[]
	);

	const viewContext = useViewContext();

	const [ autoSubmit, setAutoSubmit ] = useFormValue(
		ADVANCED_DATA_BREAKDOWNS_FORM,
		'autoSubmit'
	);

	const isSaving = useSelect(
		( select: Select ) =>
			select(
				MODULES_ANALYTICS_4
			).isFetchingSaveAdvancedDataBreakdownsSettings(),
		[]
	);

	const isCreatingDimensions = useSelect( ( select: Select ) => {
		const customDimensionsBeingCreated = SITE_GOALS_CUSTOM_DIMENSIONS.some(
			( dimension ) =>
				select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension(
					dimension
				)
		);

		return (
			customDimensionsBeingCreated ||
			select( MODULES_ANALYTICS_4 ).isSyncingAvailableCustomDimensions()
		);
	}, [] );

	const {
		setAdvancedDataBreakdownsEnabled,
		saveAdvancedDataBreakdownsSettings,
		createCustomDimensions,
	} = useDispatch( MODULES_ANALYTICS_4 );
	const { setPermissionScopeError } = useDispatch( CORE_USER );

	const enableAndCreate = useCallback( async () => {
		setAdvancedDataBreakdownsEnabled( { [ propertyID ]: true } );

		const { error } = await saveAdvancedDataBreakdownsSettings();

		// A failed save shows at the top of the settings through
		// StoreErrorNotices, so stop here and skip creating the dimensions.
		if ( error ) {
			return;
		}

		createCustomDimensions();
	}, [
		propertyID,
		setAdvancedDataBreakdownsEnabled,
		saveAdvancedDataBreakdownsSettings,
		createCustomDimensions,
	] );

	function handleEnable() {
		if ( hasEditScope === false ) {
			setAutoSubmit( true );

			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to create the custom dimensions needed for the Site Goals widget.',
					'google-site-kit'
				),
				data: {
					status: 403,
					scopes: [ EDIT_SCOPE ],
					skipModal: true,
				},
			} );
			return;
		}

		enableAndCreate();
	}

	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			setAutoSubmit( false );
			enableAndCreate();
		}
	}, [ autoSubmit, enableAndCreate, hasEditScope, setAutoSubmit ] );

	/**
	 * The green check reflects whether the selected property has all the Site
	 * Goals custom dimensions, so it updates with the property selection and
	 * stays when you switch away and back. The per-property enabled flag
	 * controls custom dimension creation, not this display state.
	 */
	const isComplete = hasAllCustomDimensions === true;

	// This uses Link instead of SupportLink, because SupportLink is not typed
	// for the `external` and `onClick` props in TypeScript.
	const learnMoreLink = (
		<Link
			href={ supportURL }
			aria-label={ __(
				'Learn more about advanced data breakdowns',
				'google-site-kit'
			) }
			onClick={ () => {
				trackEvent(
					viewContext,
					'click_learn_more_link',
					'advanced_data_breakdowns'
				);
			} }
			external
			hideExternalIndicator
		/>
	);

	const helperText = isComplete
		? createInterpolateElement(
				__(
					'Detailed performance tracking and access to the most granular data available, enabled by granting Site Kit permission to create custom dimensions in Google Analytics. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMoreLink }
		  )
		: createInterpolateElement(
				__(
					'Grant Site Kit permission to create custom dimensions in Google Analytics. This enables detailed performance tracking and access to the most granular data available. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMoreLink }
		  );

	return (
		<MeasurementSettingRow
			loading={ ! isSettingsLoaded || ! isDimensionsLoaded }
			isEnabled={ isComplete }
			title={ __( 'Advanced data breakdowns', 'google-site-kit' ) }
			description={ helperText }
			action={
				// @ts-expect-error - The `SpinnerButton` component is not typed yet.
				<SpinnerButton
					onClick={ handleEnable }
					disabled={
						isSaving ||
						isCreatingDimensions ||
						! hasModuleAccess ||
						! isValidPropertyID( propertyID )
					}
					isSaving={ isSaving || isCreatingDimensions }
					inverse
				>
					{ __( 'Enable', 'google-site-kit' ) }
				</SpinnerButton>
			}
		/>
	);
};

export default SettingsAdvancedDataBreakdowns;
