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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Link from '../../../../components/Link';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import Notice from '../../../../components/Notice/index';
import { TYPES } from '../../../../components/Notice/constants';

export default function CreatePropertyInfoNotice() {
	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	return (
		<Notice
			type={ TYPES.INFO }
			description={ createInterpolateElement(
				__(
					'Got a Google Analytics property and want to find out how to use it with Site Kit? <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: <Link href={ documentationURL } external />,
				}
			) }
		/>
	);
}
