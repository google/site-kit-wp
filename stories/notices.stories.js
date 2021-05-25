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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SettingsNotice, { TYPE_WARNING, TYPE_INFO, TYPE_SUGGESTION } from '../assets/js/components/SettingsNotice';
import InfoIcon from '../assets/svg/info-icon.svg';
import Link from '../assets/js/components/Link';

const LearnMore = () => {
	return (
		<Link
			href="https://sitekit.withgoogle.com/documentation/ga4-analytics-property/"
			external
			inherit
		>
			{ __( 'Learn more here.', 'google-site-kit' ) }
		</Link>
	);
};

storiesOf( 'Global/Notices', module )
	.add( 'Settings warning notice', () => (
		<SettingsNotice type={ TYPE_WARNING }>
			{ 'This is a warning.' }
		</SettingsNotice>
	) )
	.add( 'Settings info notice single line', () => (
		<SettingsNotice type={ TYPE_INFO } Icon={ <InfoIcon /> } LearnMore={ <LearnMore /> }>
			{ 'This is an information.' }
		</SettingsNotice>
	) )
	.add( 'Settings info notice multi line', () => (
		<SettingsNotice type={ TYPE_INFO } Icon={ <InfoIcon /> } LearnMore={ <LearnMore /> }>
			{ new Array( 10 ).fill( 'This is an information. ' ) }
		</SettingsNotice>
	) )
	.add( 'Settings info notice no Icon', () => (
		<SettingsNotice type={ TYPE_INFO } LearnMore={ <LearnMore /> }>
			{ 'This is an information.' }
		</SettingsNotice>
	) )
	.add( 'Settings info notice no LearnMore', () => (
		<SettingsNotice type={ TYPE_INFO } Icon={ <InfoIcon /> }>
			{ 'This is an information.' }
		</SettingsNotice>
	) )
	.add( 'Settings suggestion notice', () => (
		<SettingsNotice type={ TYPE_SUGGESTION }>
			{ 'This is a suggestion.' }
		</SettingsNotice>
	) );
