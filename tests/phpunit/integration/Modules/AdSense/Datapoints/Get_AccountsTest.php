<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\Get_AccountsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Accounts;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\Account;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class Get_AccountsTest extends DatapointTestCase {
	public function test_parse_response() {
		$datapoint = new Get_Accounts(
			array(
				'service' => function () {
					return $this->service;
				},
			)
		);

		$open_account         = new Account();
		$open_account['name'] = 'accounts/pub-1';
		$open_account->setDisplayName( 'B Account' );
		$open_account->setState( 'READY' );

		$closed_account         = new Account();
		$closed_account['name'] = 'accounts/pub-2';
		$closed_account->setDisplayName( 'A Account' );
		$closed_account->setState( 'CLOSED' );

		$response = new class( array( $open_account, $closed_account ) ) {
			private $accounts;

			public function __construct( $accounts ) {
				$this->accounts = $accounts;
			}

			public function getAccounts() {
				return $this->accounts;
			}
		};

		$parsed = $datapoint->parse_response( $response, new Data_Request( 'GET', 'modules', 'adsense', 'accounts', array() ) );

		$this->assertCount( 1, $parsed, 'Expected only the open account to be returned.' );
		$this->assertEquals( 'pub-1', $parsed[0]->_id, 'Expected the parsed account ID to be normalized.' );
	}
}
