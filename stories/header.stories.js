import { storiesOf } from '@storybook/react';
import Header from 'GoogleComponents/header';
import { googlesitekit as dashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-dashboard-googlesitekit';

storiesOf( 'Global', module )
	.add( 'Plugin Header', () => {
		window.googlesitekit = dashboardData;
		window.googlesitekit.admin.userData.picture = 'http://gravatar.com/avatar/?s=96&d=mm';
		return (
			<Header/>
		);
	}, {
		options: {
			delay: 3000, // Wait for image to load.
		}
	} );
