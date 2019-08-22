/**
 * HelpLink component.
 *
 * Google Site Kit, Copyright 2019 Google LLC
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
import Link from './link';

const HelpLink = () => {
	const label = __( 'Need help?', 'google-site-kit' );

	const url = 'https://sitekit.withgoogle.com/documentation/';

	return (
		<Link className="googlesitekit-help-link" href={ url } external>
			{ label }
		</Link>
	);
};

export default HelpLink;
