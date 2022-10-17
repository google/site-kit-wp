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
import { useCallback, lazy, Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import {
	MODULES_THANK_WITH_GOOGLE,
	CTA_PLACEMENT_DYNAMIC_HIGH,
	CTA_PLACEMENT_DYNAMIC_LOW,
} from '../../datastore/constants';
import ImageRadio from '../../../../components/ImageRadio';
const { useSelect, useDispatch } = Data;

const DynamicLowSVG = lazy( () =>
	import( '../../../../../svg/graphics/twg-dynamic-low.svg' )
);
const DynamicHighSVG = lazy( () =>
	import( '../../../../../svg/graphics/twg-dynamic-high.svg' )
);

export default function ProminenceRadio() {
	const { setCTAPlacement } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const ctaPlacement = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCTAPlacement()
	);

	const onChange = useCallback(
		( { target } = {} ) => {
			const { value: placement } = target || {};
			setCTAPlacement( placement );
		},
		[ setCTAPlacement ]
	);

	return (
		<div className="googlesitekit-twg-setting-field googlesitekit-twg-prominence-radio">
			<h4>{ __( 'Prominence', 'google-site-kit' ) }</h4>
			<div className="googlesitekit-image-radio-options">
				<Suspense fallback={ <ProgressBar small /> }>
					<ImageRadio
						id={ `cta-placement-${ CTA_PLACEMENT_DYNAMIC_LOW }` }
						name="cta-placement"
						value={ CTA_PLACEMENT_DYNAMIC_LOW }
						label={ __( 'Low', 'google-site-kit' ) }
						description={ __(
							'Floats at the bottom of the page',
							'google-site-kit'
						) }
						image={ <DynamicLowSVG /> }
						onChange={ onChange }
						checked={ ctaPlacement === CTA_PLACEMENT_DYNAMIC_LOW }
					/>
					<ImageRadio
						id={ `cta-placement-${ CTA_PLACEMENT_DYNAMIC_HIGH }` }
						name="cta-placement"
						value={ CTA_PLACEMENT_DYNAMIC_HIGH }
						label={ __( 'High', 'google-site-kit' ) }
						description={ __(
							'Can be temporary dismissed',
							'google-site-kit'
						) }
						image={ <DynamicHighSVG /> }
						onChange={ onChange }
						checked={ ctaPlacement === CTA_PLACEMENT_DYNAMIC_HIGH }
					/>
				</Suspense>
			</div>
		</div>
	);
}
