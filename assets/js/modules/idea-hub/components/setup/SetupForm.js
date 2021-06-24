/**
 * Idea Hub Setup Form component.
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
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import Checkbox from '../../../../components/Checkbox';
const { useSelect } = Data;

export default function SetupForm() {
	const { description } = useSelect( ( select ) => select( CORE_MODULES ).getModule( 'idea-hub' ) );
	const tosAccepted = useSelect( ( select ) => select( STORE_NAME ).getTosAccepted() );

	return (
		<form className="googlesitekit-idea-hub-setup__form">
			<p>{ description }</p>
			<Checkbox
				name="tosAccepted"
				id="tosAccepted"
				value="1"
				checked={ tosAccepted }
				onChange={ () => {} }
			>
				{ __( 'I agree that Idea Hub will track my usage of the feature in order to provide a better idea suggestions', 'google-site-kit' ) }
			</Checkbox>
		</form>
	);
}
