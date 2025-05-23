/**
 * SettingsNotice Stories.
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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import SettingsNotice, { TYPE_WARNING, TYPE_SUGGESTION } from './';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Link from '../Link';

function LearnMore() {
	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	return (
		<Link href={ documentationURL } external>
			Learn more
		</Link>
	);
}

function Template( args ) {
	return <SettingsNotice { ...args } />;
}

export const Warning = Template.bind( {} );
Warning.args = {
	type: TYPE_WARNING,
	LearnMore,
	notice: 'This is a warning.',
};

export const SuggestionNotice = Template.bind( {} );
SuggestionNotice.args = {
	type: TYPE_SUGGESTION,
	LearnMore,
	notice: 'This is a suggestion.',
};

export default {
	title: 'Global/SettingsNotice',
	component: SettingsNotice,
};
