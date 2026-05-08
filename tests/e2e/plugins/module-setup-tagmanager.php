<?php
/**
 * Plugin Name: E2E Tests Module Setup TagManager API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking TagManager Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\E2E\Modules\Tag_Manager;

use Google\Site_Kit\Core\REST_API\REST_Routes;

const ACCOUNT_ID_A = '100';
const ACCOUNT_ID_B = '101';

const PUBLIC_ID_X  = 'GTM-ABCXYZ';
const PUBLIC_ID_Y  = 'GTM-BCDWXY';
const PUBLIC_ID_AX = 'GTM-AMPXYZ';
const PUBLIC_ID_AY = 'GTM-AMPWXY';

const CONTAINER_ID_X  = '200';
const CONTAINER_ID_Y  = '201';
const CONTAINER_ID_AX = '210';
const CONTAINER_ID_AY = '211';

function filter_by_account_id( $items, $account_id ) {
	return array_values(
		array_filter(
			$items,
			function ( $item ) use ( $account_id ) {
				return $item['accountId'] === $account_id;
			}
		)
	);
}

add_action(
	'rest_api_init',
	function () {

		$accounts   = array(
			array(
				'accountId' => ACCOUNT_ID_A,
				'name'      => 'Test Account A',
			),
			array(
				'accountId' => ACCOUNT_ID_B,
				'name'      => 'Test Account B',
			),
		);
		$containers = array(
			array(
				'accountId'    => ACCOUNT_ID_A,
				'publicId'     => PUBLIC_ID_X,
				'containerId'  => CONTAINER_ID_X,
				'name'         => 'Test Container X',
				'usageContext' => array( 'web' ),
			),
			array(
				'accountId'    => ACCOUNT_ID_B,
				'publicId'     => PUBLIC_ID_Y,
				'containerId'  => CONTAINER_ID_Y,
				'name'         => 'Test Container Y',
				'usageContext' => array( 'web' ),
			),
			array(
				'accountId'    => ACCOUNT_ID_A,
				'publicId'     => PUBLIC_ID_AX,
				'containerId'  => CONTAINER_ID_AX,
				'name'         => 'Test AMP Container AX',
				'usageContext' => array( 'amp' ),
			),
			array(
				'accountId'    => ACCOUNT_ID_B,
				'publicId'     => PUBLIC_ID_AY,
				'containerId'  => CONTAINER_ID_AY,
				'name'         => 'Test AMP Container AY',
				'usageContext' => array( 'amp' ),
			),
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/tagmanager/data/accounts',
			array(
				'methods'             => 'GET',
				'callback'            => function () use ( $accounts ) {
					return $accounts;
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/tagmanager/data/accounts-containers',
			array(
				'methods'             => 'GET',
				'callback'            => function ( $request ) use ( $accounts, $containers ) {
					$account_id = $request['accountID'] ?: $accounts[0]['accountId'];

					return array(
						'accounts'   => $accounts,
						'containers' => filter_by_account_id( $containers, $account_id ),
					);
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/tagmanager/data/containers',
			array(
				'methods'             => 'GET',
				'callback'            => function ( $request ) use ( $containers ) {

					return filter_by_account_id( $containers, $request['accountID'] );
				},
				'permission_callback' => '__return_true',
			),
			true
		);
	},
	0
);
