/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import AnalyticsInactiveCTA from '../assets/js/components/AnalyticsInactiveCTA';
import {
	PERMISSION_MANAGE_OPTIONS,
	STORE_NAME as CORE_USER,
} from '../assets/js/googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Global', module )
	.add( 'Analytics Inactive CTA', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_USER ).receiveCapabilities( {
				[ PERMISSION_MANAGE_OPTIONS ]: true,
			} );
			dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'analytics',
				},
			] );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<AnalyticsInactiveCTA />
			</WithTestRegistry>
		);
	} );
