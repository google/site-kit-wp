/**
 * ESLint rules: capitalization tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
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
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './acronym-case';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'acronym-case', rule, {
	valid: [
		{
			code: `
		export function myCoolHTMLParser() {
			return 'test';
		}
		      `,
		},
		{
			code: `
import { useInstanceId } from '@wordpress/compose;'

export function FancyComponent() {
	const instanceID = useInstanceId();

	return \`myId-\${instanceID}\`;
}
			`,
		},
		{
			code: `
const htmlNode = '<div></div>';
			`,
		},
		{
			code: `
const HTMLButtonComponent = () => {
	return '<Button />';
};
function urlParser(url) {
	return new URL(url);
}
function JSONParser(json) {
	return JSON.parse(json);
}
const getElementByID = ( id ) => {
	return document.getElementById(id);
};
export default function AMPExperimentJSONField() {}
export { default as AMPExperimentJSONField } from './AMPExperimentJSONField';
export const HTML = () => {};
			`,
		},
		{
			code: "const AMP_PROJECT_TEST_URL = 'foo';",
		},
		{
			code: "const amp = '';",
		},
		{
			code: 'const json = false;',
		},
		{
			code: 'const html = () => {};',
		},
		{
			code: 'const HTML = () => {};',
		},
		// New valid test cases for added acronyms
		{
			code: 'const mySDK = {};',
		},
		{
			code: 'const emmManager = {};',
		},
		{
			code: 'const restAPI = {};',
		},
		{
			code: 'const gkeCluster = {};',
		},
		{
			code: 'const uriParser = {};',
		},
		{
			code: 'const uxDesign = {};',
		},
		{
			code: 'const osVersion = {};',
		},
		{
			code: 'const gcpProject = {};',
		},
		{
			code: 'const dnsRecord = {};',
		},
		{
			code: 'const fcmToken = {};',
		},
		{
			code: 'const iamRole = {};',
		},
		{
			code: 'const ipAddress = {};',
		},
		{
			code: 'const isoDate = {};',
		},
		{
			code: 'const SDK = {};',
		},
		{
			code: 'const EMM = {};',
		},
		{
			code: 'const REST = {};',
		},
		{
			code: 'const GKE = {};',
		},
		{
			code: 'const URI = {};',
		},
		{
			code: 'const UX = {};',
		},
		{
			code: 'const OS = {};',
		},
		{
			code: 'const GCP = {};',
		},
		{
			code: 'const DNS = {};',
		},
		{
			code: 'const FCM = {};',
		},
		{
			code: 'const IAM = {};',
		},
		{
			code: 'const IP = {};',
		},
		{
			code: 'const ISO = {};',
		},
	],
	invalid: [
		{
			code: `
		const useInstanceId = () => {
			return 'random-id';
		}

		export function FancyComponent() {
			const instanceID = useInstanceId();

			return \`myId-\${instanceID}\`;
		}
		      `,
			errors: [
				{
					message: '`useInstanceId` violates naming rules.',
				},
			],
		},
		{
			code: `
const { useInstanceId } = { myCoolObject: true };

export function FancyComponent() {
	const instanceID = useInstanceId();

	return \`myId-\${instanceID}\`;
}
`,
			errors: [
				{
					message: '`useInstanceId` violates naming rules.',
				},
			],
		},
		{
			code: `
const HTMLNode = '<div></div>';
`,
			errors: [
				{
					// Acronyms at the beginning of an identifer should be entirely _lowercased_ instead
					// of uppercased.
					message: '`HTMLNode` violates naming rules.',
				},
			],
		},
		{
			code: "const Amp = '';",
			errors: [
				{
					message: '`Amp` violates naming rules.',
				},
			],
		},
		{
			code: 'const Json = false;',
			errors: [
				{
					message: '`Json` violates naming rules.',
				},
			],
		},
		{
			code: 'const Html = () => {};',
			errors: [
				{
					message: '`Html` violates naming rules.',
				},
			],
		},
		// New invalid test cases for added acronyms
		{
			code: 'const Sdk = {};',
			errors: [
				{
					message: '`Sdk` violates naming rules.',
				},
			],
		},
		{
			code: 'const Emm = {};',
			errors: [
				{
					message: '`Emm` violates naming rules.',
				},
			],
		},
		{
			code: 'const Rest = {};',
			errors: [
				{
					message: '`Rest` violates naming rules.',
				},
			],
		},
		{
			code: 'const Gke = {};',
			errors: [
				{
					message: '`Gke` violates naming rules.',
				},
			],
		},
		{
			code: 'const Uri = {};',
			errors: [
				{
					message: '`Uri` violates naming rules.',
				},
			],
		},
		{
			code: 'const Ux = {};',
			errors: [
				{
					message: '`Ux` violates naming rules.',
				},
			],
		},
		{
			code: 'const Os = {};',
			errors: [
				{
					message: '`Os` violates naming rules.',
				},
			],
		},
		{
			code: 'const Gcp = {};',
			errors: [
				{
					message: '`Gcp` violates naming rules.',
				},
			],
		},
		{
			code: 'const Dns = {};',
			errors: [
				{
					message: '`Dns` violates naming rules.',
				},
			],
		},
		{
			code: 'const Fcm = {};',
			errors: [
				{
					message: '`Fcm` violates naming rules.',
				},
			],
		},
		{
			code: 'const Iam = {};',
			errors: [
				{
					message: '`Iam` violates naming rules.',
				},
			],
		},
		{
			code: 'const Ip = {};',
			errors: [
				{
					message: '`Ip` violates naming rules.',
				},
			],
		},
		{
			code: 'const Iso = {};',
			errors: [
				{
					message: '`Iso` violates naming rules.',
				},
			],
		},
	],
} );
