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
	SITE_GOALS_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/datastore/constants';
import { trackEvent } from '@/js/util';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';

export const ADVANCED_DATA_BREAKDOWNS_FORM = 'advancedDataBreakdownsForm';

interface SettingsAdvancedDataBreakdownsProps {
	hasModuleAccess?: boolean;
}

const SettingsAdvancedDataBreakdowns: FC<
	SettingsAdvancedDataBreakdownsProps
> = ( { hasModuleAccess = true } ) => {
	const isAdvancedDataBreakdownsEnabled = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isAdvancedDataBreakdownsEnabled(),
		[]
	);

	// The setting is still loading until the selector returns a boolean.
	const isSettingsLoaded = isAdvancedDataBreakdownsEnabled !== undefined;

	const hasAllCustomDimensions = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				SITE_GOALS_CUSTOM_DIMENSIONS
			),
		[]
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
		setAdvancedDataBreakdownsEnabled( true );

		const { error } = await saveAdvancedDataBreakdownsSettings();

		// A failed save shows at the top of the settings through
		// StoreErrorNotices, so stop here and skip creating the dimensions.
		if ( error ) {
			return;
		}

		createCustomDimensions();
	}, [
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

	const isComplete =
		isAdvancedDataBreakdownsEnabled && hasAllCustomDimensions === true;

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
		? __(
				'Detailed performance tracking and access to the most granular data available, enabled by granting Site Kit permission to create custom dimensions in Google Analytics. <a>Learn more</a>',
				'google-site-kit'
		  )
		: __(
				'Grant Site Kit permission to create custom dimensions in Google Analytics. This enables detailed performance tracking and access to the most granular data available. <a>Learn more</a>',
				'google-site-kit'
		  );

	return (
		<MeasurementSettingRow
			loading={ ! isSettingsLoaded }
			isEnabled={ isComplete }
			title={ __( 'Advanced data breakdowns', 'google-site-kit' ) }
			description={ createInterpolateElement( helperText, {
				a: learnMoreLink,
			} ) }
			action={
				// @ts-expect-error - The `SpinnerButton` component is not typed yet.
				<SpinnerButton
					onClick={ handleEnable }
					disabled={
						isSaving || isCreatingDimensions || ! hasModuleAccess
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
