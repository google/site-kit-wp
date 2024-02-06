/**
 * Analytics GA4 Notice component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import SettingsNotice, {
	TYPE_INFO,
} from '../../../../components/SettingsNotice';
import Link from '../../../../components/Link';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function Notice() {
	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	return (
		<SettingsNotice
			type={ TYPE_INFO }
			LearnMore={ () => (
				<Link href={ documentationURL } external>
					{ __( 'Learn more here.', 'google-site-kit' ) }
				</Link>
			) }
			notice={ __(
				'Got a Google Analytics 4 (GA4) property and want to find out how to use it with Site Kit?',
				'google-site-kit'
			) }
		/>
	);
}
