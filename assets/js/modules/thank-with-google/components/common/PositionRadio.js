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
import { Radio } from 'googlesitekit-components';
import {
	MODULES_THANK_WITH_GOOGLE,
	CTA_PLACEMENT_STATIC_ABOVE_CONTENT,
	CTA_PLACEMENT_STATIC_AUTO,
	CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
	CTA_PLACEMENT_STATIC_BELOW_CONTENT,
} from '../../datastore/constants';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function PositionRadio() {
	const viewContext = useViewContext();

	const { setCTAPlacement } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const ctaPlacement = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCTAPlacement()
	);

	const onChange = useCallback(
		( { target } = {} ) => {
			const { value: placement } = target || {};
			setCTAPlacement( placement );
			trackEvent(
				`${ viewContext }_thank-with-google`,
				'change_cta_position',
				placement.split( '_' ).pop()
			);
		},
		[ setCTAPlacement, viewContext ]
	);

	return (
		<div className="googlesitekit-twg-setting-field googlesitekit-twg-position-radio">
			<h4>{ __( 'Position', 'google-site-kit' ) }</h4>
			<div className="googlesitekit-twg-position-radio__option">
				<Radio
					id={ `cta-placement-${ CTA_PLACEMENT_STATIC_AUTO }` }
					name="cta-placement"
					value={ CTA_PLACEMENT_STATIC_AUTO }
					checked={ ctaPlacement === CTA_PLACEMENT_STATIC_AUTO }
					onChange={ onChange }
				>
					{ __( 'Auto', 'google-site-kit' ) }
				</Radio>
				<p>
					{ __(
						'The prompt is automatically placed where it will perform best',
						'google-site-kit'
					) }
				</p>
				<Radio
					id={ `cta-placement-${ CTA_PLACEMENT_STATIC_ABOVE_CONTENT }` }
					name="cta-placement"
					value={ CTA_PLACEMENT_STATIC_ABOVE_CONTENT }
					checked={
						ctaPlacement === CTA_PLACEMENT_STATIC_ABOVE_CONTENT
					}
					onChange={ onChange }
				>
					{ __( 'Above the post', 'google-site-kit' ) }
				</Radio>
				<p>
					{ __(
						'The prompt is placed before the main post content',
						'google-site-kit'
					) }
				</p>
				<Radio
					id={ `cta-placement-${ CTA_PLACEMENT_STATIC_BELOW_CONTENT }` }
					name="cta-placement"
					value={ CTA_PLACEMENT_STATIC_BELOW_CONTENT }
					checked={
						ctaPlacement === CTA_PLACEMENT_STATIC_BELOW_CONTENT
					}
					onChange={ onChange }
				>
					{ __( 'Below the post', 'google-site-kit' ) }
				</Radio>
				<p>
					{ __(
						'The prompt is placed after the main post content',
						'google-site-kit'
					) }
				</p>
				<Radio
					id={ `cta-placement-${ CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH }` }
					name="cta-placement"
					value={ CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH }
					checked={
						ctaPlacement ===
						CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH
					}
					onChange={ onChange }
				>
					{ __( 'Below the 1st paragraph', 'google-site-kit' ) }
				</Radio>
				<p>
					{ __(
						'The prompt is placed after the first paragraph in the main post content',
						'google-site-kit'
					) }
				</p>
			</div>
		</div>
	);
}
