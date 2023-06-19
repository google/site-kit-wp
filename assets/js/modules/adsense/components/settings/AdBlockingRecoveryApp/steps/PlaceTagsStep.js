/**
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Checkbox, SpinnerButton } from 'googlesitekit-components';
import { MODULES_ADSENSE } from '../../../../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function PlaceTagsStep() {
	const useAdBlockerDetectionErrorSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockerDetectionErrorSnippet()
	);

	const { setUseAdBlockerDetectionErrorSnippet } =
		useDispatch( MODULES_ADSENSE );

	const onErrorProtectionTagOptionChange = useCallback(
		( { target } ) => {
			setUseAdBlockerDetectionErrorSnippet( !! target.checked );
		},
		[ setUseAdBlockerDetectionErrorSnippet ]
	);

	// Error snippet option is enabled by default.
	useMount( () => {
		if ( ! useAdBlockerDetectionErrorSnippet ) {
			setUseAdBlockerDetectionErrorSnippet( true );
		}
	} );

	return (
		<Fragment>
			<p>
				{ __(
					'Identify site visitors that have an ad blocker browser extension installed. These site visitors will see the ad blocking recovery message created in AdSense.',
					'google-site-kit'
				) }
			</p>
			<Checkbox
				checked={ useAdBlockerDetectionErrorSnippet }
				id="ad-blocking-recovery-error-protection-tag-checkbox"
				name="ad-blocking-recovery-error-protection-tag-checkbox"
				value="1"
				onChange={ onErrorProtectionTagOptionChange }
			>
				{ __(
					'Place the error protection tag (optional)',
					'google-site-kit'
				) }
			</Checkbox>
			<p className="googlesitekit-ad-blocking-recovery__error-protection-tag-info">
				{ __(
					'If a site visitor’s ad blocker browser extension also blocks the standard ad blocking recovery tag, the error protection tag will show a non-customizable ad blocking recovery message to visitors when enabled.',
					'google-site-kit'
				) }
			</p>
			<SpinnerButton>
				{ __( 'Place tag', 'google-site-kit' ) }
			</SpinnerButton>
		</Fragment>
	);
}
