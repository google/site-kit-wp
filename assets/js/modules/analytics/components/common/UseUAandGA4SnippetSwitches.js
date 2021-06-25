/**
 * Analytics Use UA and GA4 Snippet Switch component.
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
import { STORE_NAME } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import Switch from '../../../../components/Switch';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function UseUAandGA4SnippetSwitches() {
	const useUASnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const canUseUASnippet = useSelect( ( select ) => select( STORE_NAME ).getCanUseSnippet() );
	const useGA4Snippet = useSelect( select( MODULES_ANALYTICS_4 ).getUseSnippet() );
	const canUseGA4Snippet = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getCanUseSnippet() );

	if ( useGA4Snippet === undefined || useUASnippet === undefined ) {
		return null;
	}
}
