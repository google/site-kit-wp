/**
 * Tag Manager object builders.
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
import { build, sequence, oneOf, perBuild } from '@jackfranklin/test-data-bot';
import faker from 'faker';

/**
 * Internal dependencies
 */
import { CONTEXT_WEB, CONTEXT_AMP } from '../constants';

/**
 * Creates an account object in the format returned by the list endpoint.
 *
 * @since 1.11.0
 * @see {@link https://developers.google.com/tag-manager/api/v2/reference/accounts/list}
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
		accountId: sequence( ( num ) => `${ 100 + num }` ), // eslint-disable-line sitekit/acronym-case
		name: perBuild( () => faker.lorem.words() ),
	},
	postBuild: ( account ) => {
		const { accountId } = account; // eslint-disable-line sitekit/acronym-case
		return {
			...account,
			path: `accounts/${ accountId }`, // eslint-disable-line sitekit/acronym-case
		};
	},
} );

/**
 * Creates a container object in the format returned by the list endpoint.
 *
 * @since 1.11.0
 * @see {@link https://developers.google.com/tag-manager/api/v2/reference/accounts/containers/list}
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
		accountId: perBuild( () => faker.datatype.number().toString() ), // eslint-disable-line sitekit/acronym-case
		containerId: sequence( ( num ) => `${ 200 + num }` ), // eslint-disable-line sitekit/acronym-case
		name: perBuild( () => faker.lorem.words() ),
		// eslint-disable-next-line sitekit/acronym-case
		publicId: perBuild( () => {
			const char = faker.random.alphaNumeric;
			return `GTM-FAKE${ char() }${ char() }${ char() }`.toUpperCase();
		} ),
		usageContext: [ oneOf( CONTEXT_WEB, CONTEXT_AMP ) ],
		fingerprint: Date.now().toString(),
		// eslint-disable-next-line sitekit/acronym-case
		tagManagerUrl:
			'https://tagmanager.google.com/#/container/accounts/{accountId}/containers/{containerId}/workspaces?apiLink=container',
	},
	postBuild: ( container ) => {
		const { accountId, containerId } = container; // eslint-disable-line sitekit/acronym-case

		return {
			...container,
			// eslint-disable-next-line sitekit/acronym-case
			path: `accounts/${ accountId }/containers/${ containerId }`,
			// eslint-disable-next-line sitekit/acronym-case
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
	return Array.from( { length: count } ).map( () =>
		containerBuilder( { overrides } )
	);
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
	const containers = buildContainers( count, {
		...containerOverrides,
		accountId: account.accountId, // eslint-disable-line sitekit/acronym-case
	} );

	return {
		account,
		containers,
	};
}

/* eslint-disable sitekit/acronym-case */
export const defaultTagWeb = ( { accountId, containerId } = {} ) => ( {
	accountId,
	blockingRuleId: null,
	blockingTriggerId: null,
	containerId,
	fingerprint: Date.now().toString(),
	firingRuleId: null,
	firingTriggerId: [ '2147479553' ],
	liveOnly: null,
	monitoringMetadataTagNameKey: null,
	name: 'Default web tag',
	notes: null,
	parentFolderId: null,
	path: null,
	paused: null,
	scheduleEndMs: null,
	scheduleStartMs: null,
	tagFiringOption: 'oncePerEvent',
	tagId: '2',
	tagManagerUrl: null,
	type: 'html',
	workspaceId: null,
	parameter: [
		{
			key: 'html',
			type: 'template',
			value: "console.log( 'Hello world!' );",
		},
		{
			key: 'supportDocumentWrite',
			type: 'boolean',
			value: 'false',
		},
	],
	monitoringMetadata: {
		key: null,
		type: 'map',
		value: null,
	},
} );

const defaultTagAMP = ( { accountId, containerId } = {} ) => ( {
	accountId,
	blockingRuleId: null,
	blockingTriggerId: null,
	containerId,
	fingerprint: Date.now().toString(),
	firingRuleId: null,
	firingTriggerId: [ '2147479553' ],
	liveOnly: null,
	monitoringMetadataTagNameKey: null,
	name: 'Default AMP tag',
	notes: null,
	parentFolderId: null,
	path: null,
	paused: null,
	scheduleEndMs: null,
	scheduleStartMs: null,
	tagFiringOption: 'oncePerEvent',
	tagId: '2',
	tagManagerUrl: null,
	type: 'img',
	workspaceId: null,
	parameter: [
		{
			key: 'useCacheBuster',
			type: 'boolean',
			value: 'true',
		},
		{
			key: 'url',
			type: 'template',
			value: '//example.com/favicon.ico',
		},
		{
			key: 'cacheBusterQueryParam',
			type: 'template',
			value: 'gtmcb',
		},
	],
} );

export const liveContainerVersionBuilder = build(
	'Tag Manager Live Container Version',
	{
		fields: {
			accountId: perBuild( () => faker.datatype.number().toString() ), // Relationship
			builtInVariable: [],
			container: {
				// overrides
			},
			containerId: sequence( ( num ) => `${ 200 + num }` ),
			containerVersionId: sequence( ( num ) => `${ 0 + num }` ),
			deleted: null,
			description: null,
			name: null,
			fingerprint: Date.now().toString(),
			path: 'accounts/{accountId}/containers/{containerId}/versions/{containerVersionId}',
			tag: undefined, // required, but depends on container type.
			tagManagerUrl:
				'https://tagmanager.google.com/#/versions/accounts/{accountId}/containers/{containerId}/versions/{containerVersionId}?apiLink=version',
			variable: undefined, // absent by default.
		},
		postBuild( {
			container: containerOverrides,
			tag: tagOverride,
			...object
		} ) {
			const { accountId, containerId, containerVersionId } = object;
			const commonIDs = {
				accountId: accountId.toString(),
				containerId: containerId.toString(),
			};
			const container = containerBuilder( {
				overrides: { ...containerOverrides, ...commonIDs },
			} );
			const defaultTag =
				CONTEXT_WEB === container.usageContext[ 0 ]
					? defaultTagWeb
					: defaultTagAMP;

			return {
				...object,
				...commonIDs,
				container,
				tag: tagOverride || [ defaultTag( commonIDs ) ],
				path: `accounts/${ accountId }/containers/${ containerId }/versions/${ containerVersionId }`,
				tagManagerUrl: `https://tagmanager.google.com/#/versions/accounts/${ accountId }/containers/${ containerId }/versions/${ containerVersionId }?apiLink=version`,
			};
		},
	}
);

const analyticsTagWeb = ( propertyID, { accountId, containerId } = {} ) => {
	return {
		accountId,
		blockingRuleId: null,
		blockingTriggerId: null,
		containerId,
		fingerprint: Date.now().toString(),
		firingRuleId: null,
		firingTriggerId: [ '2147479553' ],
		liveOnly: null,
		monitoringMetadataTagNameKey: null,
		name: 'Google Analytics',
		notes: null,
		parentFolderId: null,
		path: null,
		paused: null,
		scheduleEndMs: null,
		scheduleStartMs: null,
		tagFiringOption: 'oncePerEvent',
		tagId: '3',
		tagManagerUrl: null,
		type: 'ua',
		workspaceId: null,
		parameter: [
			{
				key: 'overrideGaSettings',
				type: 'boolean',
				value: 'true',
			},
			{
				key: 'trackType',
				type: 'template',
				value: 'TRACK_PAGEVIEW',
			},
			{
				key: 'trackingId',
				type: 'template',
				value: propertyID,
			},
		],
		monitoringMetadata: {
			key: null,
			type: 'map',
			value: null,
		},
	};
};
const analyticsTagAMP = ( propertyID, { accountId, containerId } = {} ) => {
	return {
		accountId,
		blockingRuleId: null,
		blockingTriggerId: null,
		containerId,
		fingerprint: Date.now().toString(),
		firingRuleId: null,
		firingTriggerId: [ '2147479553' ],
		liveOnly: null,
		monitoringMetadataTagNameKey: null,
		name: 'Google Analytics',
		notes: null,
		parentFolderId: null,
		path: null,
		paused: null,
		scheduleEndMs: null,
		scheduleStartMs: null,
		tagFiringOption: 'oncePerEvent',
		tagId: '3',
		tagManagerUrl: null,
		type: 'ua_amp',
		workspaceId: null,
		parameter: [
			{
				key: 'trackType',
				type: 'template',
				value: 'TRACK_PAGEVIEW',
			},
			{
				key: 'trackingId',
				type: 'template',
				value: propertyID,
			},
		],
	};
};
/* eslint-enable sitekit/acronym-case */

export const buildLiveContainerVersionWeb = ( {
	accountID = '100',
	propertyID,
} = {} ) => {
	return liveContainerVersionBuilder( {
		overrides: {
			accountId: accountID, // eslint-disable-line sitekit/acronym-case
			container: {
				usageContext: [ CONTEXT_WEB ],
			},
		},
		map( object ) {
			if ( propertyID ) {
				object.tag = [ analyticsTagWeb( propertyID, object ) ];
			}
			return object;
		},
	} );
};

export const buildLiveContainerVersionAMP = ( {
	accountID = '100',
	propertyID,
} = {} ) => {
	return liveContainerVersionBuilder( {
		overrides: {
			accountId: accountID, // eslint-disable-line sitekit/acronym-case
			container: {
				usageContext: [ CONTEXT_AMP ],
			},
		},
		map( object ) {
			if ( propertyID ) {
				object.tag = [ analyticsTagAMP( propertyID, object ) ];
			}
			return object;
		},
	} );
};
