/**
 * WarningNotice Component Stories.
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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WarningNotice from './WarningNotice';
import Link from './Link';
import ExternalIcon from '../../svg/icons/external-rounded.svg';

function Template( args ) {
	return <WarningNotice { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'WarningNotice';
Default.args = {
	children: createInterpolateElement(
		'Ad blocker detected; please disable it to get the latest AdSense data. <Link>Get help</Link>',
		{
			Link: (
				<Link
					href="#"
					external
					hideExternalIndicator
					trailingIcon={ <ExternalIcon width={ 13 } height={ 14 } /> }
				/>
			),
		}
	),
};

export default {
	title: 'Components/WarningNotice',
};
