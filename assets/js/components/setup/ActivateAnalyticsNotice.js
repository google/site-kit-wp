/**
 * ActivateAnalyticsNotice component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Checkbox } from 'googlesitekit-components';
import {
	ANALYTICS_NOTICE_FORM_NAME,
	ANALYTICS_NOTICE_CHECKBOX,
} from './constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import AnalyticsSetupSidekickSVG from '../../../svg/graphics/analytics-setup-sidekick.svg';

export default function ActivateAnalyticsNotice() {
	const { setValues } = useDispatch( CORE_FORMS );
	const checked = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			ANALYTICS_NOTICE_FORM_NAME,
			ANALYTICS_NOTICE_CHECKBOX
		)
	);

	const handleOnChange = useCallback(
		( event ) => {
			setValues( ANALYTICS_NOTICE_FORM_NAME, {
				[ ANALYTICS_NOTICE_CHECKBOX ]: event.target.checked,
			} );
		},
		[ setValues ]
	);

	return (
		<div className="googlesitekit-setup-analytics-notice">
			<div className="googlesitekit-setup-analytics-notice__opt-in">
				<Checkbox
					id="googlesitekit-analytics-setup-opt-in"
					name="googlesitekit-analytics-setup-opt-in"
					value="1"
					checked={ checked }
					onChange={ handleOnChange }
				>
					{ createInterpolateElement(
						__(
							'<strong>Connect Google Analytics as part of your setup.</strong> Activate Google Analytics to track how much traffic you’re getting and how people navigate your site.',
							'google-site-kit'
						),
						{
							strong: <strong />,
						}
					) }
				</Checkbox>
			</div>
			<div className="googlesitekit-setup-analytics-notice__icon">
				<AnalyticsSetupSidekickSVG />
			</div>
		</div>
	);
}
