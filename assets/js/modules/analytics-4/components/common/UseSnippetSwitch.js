/**
 * GA4 Use Snippet Switch component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { trackEvent } from '../../../../util';
import Switch from '../../../../components/Switch';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function UseSnippetSwitch() {
	const viewContext = useViewContext();
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUseSnippet()
	);

	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );
	const onChange = useCallback( () => {
		const newUseSnippet = ! useSnippet;
		setUseSnippet( newUseSnippet );
		trackEvent(
			`${ viewContext }_analytics`,
			newUseSnippet ? 'enable_tag' : 'disable_tag',
			'ga4'
		);
	}, [ useSnippet, setUseSnippet, viewContext ] );

	if ( useSnippet === undefined ) {
		return null;
	}

	return (
		<div className="googlesitekit-analytics-usesnippet">
			<Switch
				label={ __(
					'Place Google Analytics 4 code',
					'google-site-kit'
				) }
				checked={ useSnippet }
				onClick={ onChange }
				hideLabel={ false }
			/>
			<p>
				{ useSnippet && (
					<span>
						{ __(
							'Site Kit will add the GA4 code automatically.',
							'google-site-kit'
						) }
					</span>
				) }
				{ ! useSnippet && (
					<span>
						{ __(
							'Site Kit will not add the GA4 code to your site.',
							'google-site-kit'
						) }
					</span>
				) }
			</p>
		</div>
	);
}
