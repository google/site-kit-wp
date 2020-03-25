import React from 'react';

import { fireEvent, subscribeUntil, render } from 'test-utils';
import { createTestRegistry } from 'tests/js/utils';
import { STORE_NAME as modulesAnalyticsStoreName } from '../datastore';
import * as fixtures from '../datastore/__fixtures__';

import AccountSelect from './account-select';

const addAnalyticsAccounts = async ( registry ) => {
	fetch
		.doMockOnceIf(
			/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/
		)
		.mockResponseOnce(
			JSON.stringify( fixtures.accountsPropertiesProfiles ),
			{ status: 200 }
		);

	registry.select( modulesAnalyticsStoreName ).getAccounts();
	await subscribeUntil( registry,
		() => (
			registry.select( modulesAnalyticsStoreName ).getAccounts() !== undefined
		),
	);
};

describe( 'AccountSelect', () => {
	it.skip( 'should render an option for each analytics account', async () => {
		const registry = createTestRegistry();
		await addAnalyticsAccounts( registry );

		const { container, getByLabelText } = render( <AccountSelect />, { registry } );
		fireEvent.click( getByLabelText( 'Account' ) );

		// expect( container.firstChild ).toMatchSnapshot();
		expect( container.children[ 1 ].tagName ).toEqual( 'SELECT' );
	} );
} );
