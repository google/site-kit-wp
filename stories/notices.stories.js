/**
 * Notices Stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SettingsNotice, {
	TYPE_WARNING,
	TYPE_INFO,
	TYPE_SUGGESTION,
} from '../assets/js/components/SettingsNotice';
import WarningIcon from '../assets/svg/icons/warning-icon.svg';
import Link from '../assets/js/components/Link';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
const { useSelect } = Data;

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

storiesOf( 'Global/Notices', module )
	.add( 'Settings warning notice', () => (
		<SettingsNotice
			type={ TYPE_WARNING }
			LearnMore={ LearnMore }
			notice="This is a warning."
		/>
	) )
	.add( 'Settings info notice single line', () => (
		<SettingsNotice
			type={ TYPE_INFO }
			LearnMore={ LearnMore }
			notice="This is an information."
		/>
	) )
	.add( 'Settings info notice with a long notice', () => (
		<SettingsNotice
			type={ TYPE_INFO }
			LearnMore={ LearnMore }
			notice={ new Array( 10 ).fill( 'This is an information. ' ) }
		/>
	) )
	.add( 'Settings info notice with children', () => (
		<SettingsNotice
			type={ TYPE_INFO }
			LearnMore={ LearnMore }
			notice={ new Array( 5 ).fill( 'This is an information. ' ) }
		>
			<p>This is more information about the information!</p>
		</SettingsNotice>
	) )
	.add( 'Settings info notice no LearnMore', () => (
		<SettingsNotice type={ TYPE_INFO } notice="This is an information." />
	) )
	.add( 'Settings info notice with different icon', () => (
		<SettingsNotice
			type={ TYPE_INFO }
			Icon={ WarningIcon }
			LearnMore={ LearnMore }
			notice="This is an information."
		/>
	) )
	.add( 'Settings suggestion notice', () => (
		<SettingsNotice
			type={ TYPE_SUGGESTION }
			LearnMore={ LearnMore }
			notice="This is a suggestion."
		/>
	) );
