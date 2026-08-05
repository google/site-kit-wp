<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\DatapointsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Accounts;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Adunits;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Alerts;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Clients;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Notifications;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Report;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Sites;
use Google\Site_Kit\Modules\AdSense\Datapoints\Sync_Ad_Blocking_Recovery_Tags;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Adsense as Google_Service_Adsense;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\Account;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\Alert;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\AdClient;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\AdUnit;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class DatapointsTest extends TestCase {

	/**
	 * AdSense instance.
	 *
	 * @var AdSense
	 */
	private $adsense;

	/**
	 * AdSense service instance.
	 *
	 * @var Google_Service_Adsense
	 */
	private $service;

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );
		$this->adsense  = new AdSense( $context, $options, $user_options, $authentication );

		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$authentication->get_oauth_client()->set_granted_scopes( $this->adsense->get_scopes() );
		$this->adsense->get_client()->withDefer( true );
		$this->service = new Google_Service_Adsense( $this->adsense->get_client() );
	}

	public function test_get_accounts_parse_response() {
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

		$this->assertCount( 1, $parsed, 'Accounts datapoint should filter out CLOSED accounts.' );
		$this->assertEquals( 'pub-1', $parsed[0]->_id, 'Accounts datapoint should parse account ID into _id.' );
	}

	public function test_get_adunits_create_request_requires_params() {
		$datapoint = new Get_Adunits(
			array(
				'service'  => function () {
					return $this->service;
				},
				'settings' => $this->adsense->get_settings(),
			)
		);

		$request = $datapoint->create_request( new Data_Request( 'GET', 'modules', 'adsense', 'adunits', array() ) );
		$this->assertWPError( $request, 'Ad units datapoint should require accountID and clientID.' );
		$this->assertEquals( 'missing_required_param', $request->get_error_code(), 'Ad units datapoint should return missing_required_param for missing IDs.' );
	}

	public function test_get_adunits_parse_response() {
		$datapoint = new Get_Adunits(
			array(
				'service'  => function () {
					return $this->service;
				},
				'settings' => $this->adsense->get_settings(),
			)
		);

		$adunit         = new AdUnit();
		$adunit['name'] = 'accounts/pub-1/adclients/ca-pub/adunits/unit-1';

		$response = new class( array( $adunit ) ) {
			private $ad_units;

			public function __construct( $ad_units ) {
				$this->ad_units = $ad_units;
			}

			public function getAdUnits() {
				return $this->ad_units;
			}
		};

		$parsed = $datapoint->parse_response( $response, new Data_Request( 'GET', 'modules', 'adsense', 'adunits', array() ) );

		$this->assertEquals( 'unit-1', $parsed[0]->_id, 'Ad units datapoint should parse ad unit ID into _id.' );
		$this->assertEquals( 'ca-pub', $parsed[0]->_clientID, 'Ad units datapoint should parse ad client ID into _clientID.' );
	}

	public function test_get_alerts_create_request_requires_account_id() {
		$datapoint = new Get_Alerts(
			array(
				'service' => function () {
					return $this->service;
				},
			)
		);

		$request = $datapoint->create_request( new Data_Request( 'GET', 'modules', 'adsense', 'alerts', array() ) );
		$this->assertWPError( $request, 'Alerts datapoint should require accountID.' );
	}

	public function test_get_clients_parse_response() {
		$datapoint = new Get_Clients(
			array(
				'service' => function () {
					return $this->service;
				},
			)
		);

		$client         = new AdClient();
		$client['name'] = 'accounts/pub-1/adclients/client-1';

		$response = new class( array( $client ) ) {
			private $ad_clients;

			public function __construct( $ad_clients ) {
				$this->ad_clients = $ad_clients;
			}

			public function getAdClients() {
				return $this->ad_clients;
			}
		};

		$parsed = $datapoint->parse_response( $response, new Data_Request( 'GET', 'modules', 'adsense', 'clients', array() ) );

		$this->assertEquals( 'client-1', $parsed[0]->_id, 'Clients datapoint should parse client ID into _id.' );
		$this->assertEquals( 'pub-1', $parsed[0]->_accountID, 'Clients datapoint should parse account ID into _accountID.' );
	}

	public function test_get_notifications_parse_response() {
		$severe_alert = new Alert();
		$severe_alert->setSeverity( 'SEVERE' );
		$severe_alert->setName( 'test-alert' );
		$severe_alert->setMessage( 'Severe alert message' );

		$warning_alert = new Alert();
		$warning_alert->setSeverity( 'WARNING' );
		$warning_alert->setName( 'warning-alert' );
		$warning_alert->setMessage( 'Warning alert message' );

		$this->adsense->get_settings()->merge( array( 'accountID' => 'pub-1234567890' ) );

		$datapoint = new Get_Notifications(
			array(
				'settings'        => $this->adsense->get_settings(),
				'get_data'        => function () use ( $severe_alert, $warning_alert ) {
					return array( $severe_alert, $warning_alert );
				},
				'get_account_url' => function () {
					return 'https://www.google.com/adsense/new/pub-1234567890/home';
				},
			)
		);

		$data_request = new Data_Request( 'GET', 'modules', 'adsense', 'notifications', array() );
		$callback     = $datapoint->create_request( $data_request );
		$parsed       = $datapoint->parse_response( $callback, $data_request );

		$this->assertCount( 1, $parsed, 'Notifications datapoint should only include SEVERE alerts.' );
		$this->assertEquals( 'adsense::test-alert', $parsed[0]['id'], 'Notifications datapoint should map alert name into notification ID.' );
	}

	public function test_get_report_create_request_invalid_shared_metrics() {
		$datapoint = new Get_Report(
			array(
				'service'                             => function () {
					return $this->service;
				},
				'is_shared_data_request'              => function () {
					return true;
				},
				'create_adsense_earning_data_request' => function ( $args ) {
					return $args;
				},
			)
		);

		$request = $datapoint->create_request(
			new Data_Request(
				'GET',
				'modules',
				'adsense',
				'report',
				array(
					'startDate' => '2026-01-01',
					'endDate'   => '2026-01-31',
					'metrics'   => array( 'INVALID_METRIC' ),
				)
			)
		);

		$this->assertWPError( $request, 'Report datapoint should return WP_Error for invalid shared metrics.' );
		$this->assertEquals( 'invalid_adsense_report_metrics', $request->get_error_code(), 'Report datapoint should return invalid metrics error code.' );
	}

	public function test_get_sites_create_request_requires_account_id() {
		$datapoint = new Get_Sites(
			array(
				'service' => function () {
					return $this->service;
				},
			)
		);

		$request = $datapoint->create_request( new Data_Request( 'GET', 'modules', 'adsense', 'sites', array() ) );
		$this->assertWPError( $request, 'Sites datapoint should require accountID.' );
	}

	public function test_sync_ad_blocking_recovery_tags_parse_response() {
		$tag_store = new class() {
			public $value;

			public function set( $value ) {
				$this->value = $value;
			}
		};

		$datapoint = new Sync_Ad_Blocking_Recovery_Tags(
			array(
				'service'                  => function () {
					return $this->service;
				},
				'settings'                 => $this->adsense->get_settings(),
				'ad_blocking_recovery_tag' => $tag_store,
				'normalize_account_id'     => function ( $account_id ) {
					return AdSense::normalize_account_id( $account_id );
				},
			)
		);

		$response = new class() {
			public function getTag() {
				return 'test-recovery-tag';
			}

			public function getErrorProtectionCode() {
				return 'test-error-protection-code';
			}
		};

		$parsed = $datapoint->parse_response(
			$response,
			new Data_Request( 'POST', 'modules', 'adsense', 'sync-ad-blocking-recovery-tags', array() )
		);

		$this->assertInstanceOf( 'WP_REST_Response', $parsed, 'Sync tags datapoint should return WP_REST_Response.' );
		$this->assertEquals( array( 'success' => true ), $parsed->get_data(), 'Sync tags datapoint should return success payload.' );
		$this->assertEquals( 'test-recovery-tag', $tag_store->value['tag'], 'Sync tags datapoint should store tag value.' );
	}
}
