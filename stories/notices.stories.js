/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import SettingsNotice, { TYPE_WARNING, TYPE_INFO, TYPE_SUGGESTION } from '../assets/js/components/settings-notice';

global._googlesitekitLegacyData.canAdsRun = true;

storiesOf( 'Global/Notices', module )
	.add( 'Settings warning notice', () => (
		<SettingsNotice type={ TYPE_WARNING }>
			{ 'This is a warning.' }
		</SettingsNotice>
	) )
	.add( 'Settings info notice', () => (
		<SettingsNotice type={ TYPE_INFO }>
			{ 'This is an information.' }
		</SettingsNotice>
	) )
	.add( 'Settings suggestion notice', () => (
		<SettingsNotice type={ TYPE_SUGGESTION }>
			{ 'This is a suggestion.' }
		</SettingsNotice>
	) );
