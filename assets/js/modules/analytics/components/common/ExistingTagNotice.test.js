/**
 * Analytics Existing Tag Notice component tests.
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
 * Internal dependencies
 */
import ExistingTagNotice from './ExistingTagNotice';
import { render } from '../../../../../../tests/js/test-utils';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import * as analytics4Fixtures from '../../../analytics-4/datastore/__fixtures__';
import * as fixtures from '../../datastore/__fixtures__';

const {
	createProperty,
} = analytics4Fixtures;

const accountID = createProperty._accountID;
const { accounts, properties: propertiesUA, profiles } = fixtures.accountsPropertiesProfiles;
const propertyIDua = propertiesUA[ 0 ].id;

const features = [ 'ga4setup' ];

const {
	// id,
	webPropertyId: propertyID, // eslint-disable-line sitekit/acronym-case
	// accountId: accountID, // eslint-disable-line sitekit/acronym-case
} = fixtures.propertiesProfiles.profiles[ 0 ];

describe( 'ExistingTagNotice', () => {
	it( 'should not render if does not have existing tag', async () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
		};

		const { container } = render( <ExistingTagNotice />, { setupRegistry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render default message if has tag but ga4 not enabled', async () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
			dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( 'UA-12345678-1' );
		};

		const { findByText } = render( <ExistingTagNotice />, { setupRegistry } );

		await findByText( /An existing Analytics tag was found on your site with the ID/ );
	} );

	it.only( 'should do new functionality if ga4 tag enabled', async () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
			dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( 'UA-12345678-1' );

			// trying to set ua property id
			dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
			dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

			dispatch( MODULES_ANALYTICS ).receiveGetProperties( propertiesUA, { accountID } );
			dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [ accountID ] );

			dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, { accountID, propertyID: propertyIDua } );
			dispatch( MODULES_ANALYTICS ).finishResolution( 'getProfiles', [ accountID, propertyIDua ] );

			// this
			dispatch( MODULES_ANALYTICS ).setPropertyID( propertyID );
		};

		const { findByText } = render( <ExistingTagNotice />, { features, setupRegistry } );

		await findByText( 'ga4 enabled' );
	} );

	// If the existing UA tag is not empty but GA4 tag is empty, then

	// if a UA property is selected and it is the same one as indicated by the existing tag:
	// Display the following message
	// An existing Universal Analytics tag was found on your site with the ID {propertyID}. Since this tag refers to the same property you have selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.

	// Otherwise display the following message:
	// An existing Universal Analytics tag was found on your site with the ID {propertyID}.
} );

