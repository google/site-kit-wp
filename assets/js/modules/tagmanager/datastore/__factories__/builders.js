/* eslint-disable sitekit/camelcase-acronyms */
/**
 * Tag Manager object builders.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { build, fake, sequence, oneOf } from '@jackfranklin/test-data-bot';

/**
 * Internal dependencies
 */
import { CONTEXT_WEB, CONTEXT_AMP } from '../constants';

/**
 * Creates an account object in the format returned by the list endpoint.
 *
 * @see {@link https://developers.google.com/tag-manager/api/v2/reference/accounts/list}
 *
 * @since 1.11.0
 * @private
 *
 * @param {Object} [args]           Optional arguments to the builder.
 * @param {Object} [args.overrides] Optional fields overrides to take precedence over the default generated values.
 * @param {Object} [args.map]       Optional function for transforming the generated object.
 * @return {Object} Resulting generated account object.
 */
export const accountBuilder = build( 'Tag Manager Account', {
	fields: {
		path: 'accounts/{accountId}',
		accountId: sequence( ( num ) => `${ 100 + num }` ),
		name: fake( ( { lorem } ) => lorem.words() ),
	},
	postBuild: ( account ) => {
		const { accountId } = account;
		return {
			...account,
			path: `accounts/${ accountId }`,
		};
	},
} );

/**
 * Creates a container object in the format returned by the list endpoint.
 *
 * @see {@link https://developers.google.com/tag-manager/api/v2/reference/accounts/containers/list}
 *
 * @since 1.11.0
 * @private
 *
 * @param {Object} [args]           Optional arguments to the builder.
 * @param {Object} [args.overrides] Optional fields overrides to take precedence over the default generated values.
 * @param {Object} [args.map]       Optional function for transforming the generated object.
 * @return {Object} Resulting generated container object.
 */
export const containerBuilder = build( 'Tag Manager Container', {
	fields: {
		path: 'accounts/{accountId}/containers/{containerId}',
		accountId: fake( ( { random } ) => random.number().toString() ), // Relationship
		containerId: sequence( ( num ) => `${ 200 + num }` ),
		name: fake( ( { lorem } ) => lorem.words() ),
		publicId: fake( ( { random } ) => {
			const char = random.alphaNumeric;
			return `GTM-FAKE${ char() }${ char() }${ char() }`.toUpperCase();
		} ),
		usageContext: [
			oneOf( CONTEXT_WEB, CONTEXT_AMP ),
		],
		fingerprint: Date.now().toString(),
		tagManagerUrl: 'https://tagmanager.google.com/#/container/accounts/{accountId}/containers/{containerId}/workspaces?apiLink=container',
	},
	postBuild: ( container ) => {
		const { accountId, containerId } = container;

		return {
			...container,
			path: `accounts/${ accountId }/containers/${ containerId }`,
			tagManagerUrl: `https://tagmanager.google.com/#/container/accounts/${ accountId }/containers/${ containerId }/workspaces?apiLink=container`,
		};
	},
} );

/**
 * Generates multiple containers.
 *
 * @since 1.12.0
 * @private
 *
 * @param {number} count       Number of containers to generate.
 * @param {Object} [overrides] Optional. Object of container field overrides.
 * @return {Object[]} Array of generated container objects.
 */
export const buildContainers = ( count, overrides ) => {
	return Array.from( { length: count } )
		.map( () => containerBuilder( { overrides } ) );
};

/**
 * Generates an account with one or more containers.
 *
 * @since 1.11.0
 * @private
 *
 * @param {Object} [args]           Optional args for controlling the output.
 * @param {Object} [args.account]   Account field overrides.
 * @param {Object} [args.container] Container field overrides.
 * @param {number} [args.count]     Number of containers to create.
 * @return {Object} Generated account and containers { account, containers }.
 */
export function buildAccountWithContainers( {
	account: accountOverrides = {},
	container: containerOverrides = {},
	count = 1,
} = {} ) {
	const account = accountBuilder( { overrides: accountOverrides } );
	const containers = buildContainers(
		count,
		{
			...containerOverrides,
			accountId: account.accountId,
		},
	);

	return {
		account,
		containers,
	};
}
