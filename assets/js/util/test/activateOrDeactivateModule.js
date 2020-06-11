/**
 * Internal dependencies
 */
import { activateOrDeactivateModule } from '../';

const valuesToTest = [
	[
		'analytics',
		true,
		true,
	],
	[
		'analytics',
		false,
		false,
	],
	[
		'adsense',
		true,
		true,
	],
	[
		'adsense',
		false,
		false,
	],
];

const restApiClient = {
	async setModuleActive( slug, status ) {
		return status;
	},
};

describe( 'activateOrDeactivateModule', () => {
	it.each( valuesToTest )( 'should turn status for module %s to %p', async ( module, status, expected ) => {
		const response = await activateOrDeactivateModule( restApiClient, module, status );
		expect( response ).toStrictEqual( expected );
	} );
} );
