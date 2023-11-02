/**
 * EnhancedMeasurementSwitch component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar, Switch } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER,
} from '../../datastore/constants';
import SupportLink from '../../../../components/SupportLink';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function EnhancedMeasurementSwitch( {
	onClick,
	disabled = false,
	loading = false,
	formName = ENHANCED_MEASUREMENT_FORM,
	isEnhancedMeasurementAlreadyEnabled = false,
} ) {
	const isEnhancedMeasurementEnabled = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( formName, ENHANCED_MEASUREMENT_ENABLED )
	);

	const viewContext = useViewContext();
	const { setValues } = useDispatch( CORE_FORMS );

	const handleClick = useCallback( () => {
		setValues( formName, {
			[ ENHANCED_MEASUREMENT_ENABLED ]: ! isEnhancedMeasurementEnabled,
		} );

		trackEvent(
			`${ viewContext }_analytics`,
			// If the current status of enhanced measurement is enabled,
			// then it means that we disabled it, otherwise enabled it.
			isEnhancedMeasurementEnabled
				? 'deactivate_enhanced_measurement'
				: 'activate_enhanced_measurement'
		);

		onClick?.();
	}, [
		formName,
		isEnhancedMeasurementEnabled,
		onClick,
		setValues,
		viewContext,
	] );

	useMount( () => {
		// Ensure the Enhanced Measurement activation banner won't be shown if we've updated the setting
		// via the switch.
		setValues( ENHANCED_MEASUREMENT_FORM, {
			[ ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER ]: true,
		} );
	} );

	return (
		<div
			className={ classnames(
				'googlesitekit-analytics-enable-enhanced-measurement',
				{
					'googlesitekit-analytics-enable-enhanced-measurement--loading':
						loading,
				}
			) }
		>
			{ loading && (
				<ProgressBar
					small
					className="googlesitekit-analytics-enable-enhanced-measurement__progress--settings-edit"
				/>
			) }
			{ ! loading && isEnhancedMeasurementAlreadyEnabled && (
				<p className="googlesitekit-margin-top-0">
					Enhanced measurement is enabled for this web data stream
				</p>
			) }
			{ ! loading && ! isEnhancedMeasurementAlreadyEnabled && (
				<Switch
					label={ __(
						'Enable enhanced measurement',
						'google-site-kit'
					) }
					checked={ isEnhancedMeasurementEnabled }
					disabled={ disabled }
					onClick={ handleClick }
					hideLabel={ false }
				/>
			) }
			<p>
				{ createInterpolateElement(
					__(
						'This allows you to measure interactions with your content (e.g. file downloads, form completions, video views). <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<SupportLink
								path="/analytics/answer/9216061"
								external
							/>
						),
					}
				) }
			</p>
		</div>
	);
}

EnhancedMeasurementSwitch.propTypes = {
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	loading: PropTypes.bool,
	isEnhancedMeasurementAlreadyEnabled: PropTypes.bool,
};
