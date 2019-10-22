<?php
/**
 * Plugin Name: E2E Tests Module Setup TagManager API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking TagManager Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\E2E\Modules\TagManager;

use Google\Site_Kit\Core\REST_API\REST_Routes;

const ACCOUNT_ID_A = '100';
const ACCOUNT_ID_B = '101';

const PUBLIC_ID_X = 'GTM-ABCXYZ';
const PUBLIC_ID_Y = 'GTM-BCDWXY';

const CONTAINER_ID_X = '200';
const CONTAINER_ID_Y = '201';

function filter_by_account_id( $items, $account_id ) {
	return array_values(
		array_filter(
			$items,
			function ( $item ) use ( $account_id ) {
				return $item['accountID'] === $account_id;
			}
		)
	);
}

add_action( 'rest_api_init', function () {

	$accounts   = array(
		array(
			'accountID' => ACCOUNT_ID_A,
			'name'      => 'Test Account A',
		),
		array(
			'accountID' => ACCOUNT_ID_B,
			'name'      => 'Test Account B',
		),
	);
	$containers = array(
		array(
			'accountID'   => ACCOUNT_ID_A,
			'publicId'    => PUBLIC_ID_X,
			'containerId' => CONTAINER_ID_X,
			'name'        => 'Test Container X',
		),
		array(
			'accountID'   => ACCOUNT_ID_B,
			'publicId'    => PUBLIC_ID_Y,
			'containerId' => CONTAINER_ID_Y,
			'name'        => 'Test Container Y',
		),
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/tagmanager/data/accounts-containers',
		array(
			'callback' => function ( $request ) use ( $accounts, $containers ) {
				$account_id = $request['accountID'] ?: $accounts[0]['accountID'];

				return array(
					'accounts'   => $accounts,
					'containers' => filter_by_account_id( $containers, $account_id ),
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/tagmanager/data/containers',
		array(
			'callback' => function ( $request ) use ( $containers ) {
				return filter_by_account_id( $containers, $request['accountID'] );
			}
		),
		true
	);

}, 0 );
