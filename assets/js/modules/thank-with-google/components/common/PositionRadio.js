/**
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_THANK_WITH_GOOGLE,
	BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT,
	BUTTON_PLACEMENT_STATIC_AUTO,
	BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
	BUTTON_PLACEMENT_STATIC_BELOW_CONTENT,
} from '../../datastore/constants';
import Radio from '../../../../components/Radio';
const { useSelect, useDispatch } = Data;

export default function PositionRadio() {
	const { setButtonPlacement } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const buttonPlacement = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getButtonPlacement()
	);

	const onChange = useCallback(
		( { target } = {} ) => {
			const { value: placement } = target || {};
			setButtonPlacement( placement );
		},
		[ setButtonPlacement ]
	);

	return (
		<div className="googlesitekit-twg-setting-field googlesitekit-twg-position-radio">
			<h4>{ __( 'Position', 'google-site-kit' ) }</h4>
			<div className="googlesitekit-twg-position-radio__option">
				<Radio
					id={ `button-placement-${ BUTTON_PLACEMENT_STATIC_AUTO }` }
					name="button-placement"
					value={ BUTTON_PLACEMENT_STATIC_AUTO }
					checked={ buttonPlacement === BUTTON_PLACEMENT_STATIC_AUTO }
					onChange={ onChange }
				>
					{ __( 'Auto', 'google-site-kit' ) }
				</Radio>
				<p>
					{ __(
						'The prompt is automatically placed where it may perform best',
						'google-site-kit'
					) }
				</p>
			</div>
			<div className="googlesitekit-twg-position-radio__option">
				<h5>{ __( 'Manual', 'google-site-kit' ) }</h5>
				<p>
					{ __(
						'Choose where you want to display Thank with Google on the page',
						'google-site-kit'
					) }
				</p>
				<div className="googlesitekit-twg-position-radio__suboptions">
					<Radio
						id={ `button-placement-${ BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT }` }
						name="button-placement"
						value={ BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT }
						checked={
							buttonPlacement ===
							BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT
						}
						onChange={ onChange }
					>
						{ __( 'Above the post', 'google-site-kit' ) }
					</Radio>
					<Radio
						id={ `button-placement-${ BUTTON_PLACEMENT_STATIC_BELOW_CONTENT }` }
						name="button-placement"
						value={ BUTTON_PLACEMENT_STATIC_BELOW_CONTENT }
						checked={
							buttonPlacement ===
							BUTTON_PLACEMENT_STATIC_BELOW_CONTENT
						}
						onChange={ onChange }
					>
						{ __( 'Below the post', 'google-site-kit' ) }
					</Radio>
					<Radio
						id={ `button-placement-${ BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH }` }
						name="button-placement"
						value={ BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH }
						checked={
							buttonPlacement ===
							BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH
						}
						onChange={ onChange }
					>
						{ __( 'Below the 1st paragraph', 'google-site-kit' ) }
					</Radio>
				</div>
			</div>
		</div>
	);
}
