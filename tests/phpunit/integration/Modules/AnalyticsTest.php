<?php
/**
 * AnalyticsTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Data_Available_State_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsReporting\ReportRequest as Google_Service_AnalyticsReporting_ReportRequest;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsReporting\OrderBy as Google_Service_AnalyticsReporting_OrderBy;
use \ReflectionMethod;

/**
 * @group Modules
 */
class AnalyticsTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;
	use Module_With_Service_Entity_ContractTests;
	use Module_With_Data_Available_State_ContractTests;

	public function test_register() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_analytics_adsense_linked' );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'web_stories_story_head' );

		$analytics->register();

		// Test registers scopes.
		$this->assertEquals(
			$analytics->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);

		$this->assertFalse( get_option( 'googlesitekit_analytics_adsense_linked' ) );
		$this->assertFalse( $analytics->is_connected() );

		// Test actions for tracking opt-out are added.
		$this->assertTrue( has_action( 'wp_head' ) );
		$this->assertTrue( has_action( 'web_stories_story_head' ) );
	}

	public function test_is_connected() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Requires get_data to be connected.
		$this->assertFalse( $analytics->is_connected() );
	}

	public function test_scopes() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
			),
			$analytics->get_scopes()
		);
	}

	public function test_data_available_reset_on_property_change() {
		$analytics = new Analytics( $this->get_amp_primary_context() );
		$analytics->register();
		$analytics->get_settings()->merge(
			array(
				'propertyID' => 'UA-12345678-1',
			)
		);
		$analytics->set_data_available();
		$analytics->get_settings()->merge(
			array(
				'propertyID' => 'UA-87654321-1',
			)
		);

		$this->assertFalse( $analytics->is_data_available() );
	}

	public function test_on_deactivation() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options   = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );
		$options->set( 'googlesitekit_analytics_adsense_linked', 'test-linked-value' );
		$analytics->set_data_available();

		$analytics->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
		$this->assertOptionNotExists( 'googlesitekit_analytics_adsense_linked' );
		$this->assertFalse( $analytics->is_data_available() );
	}

	public function test_get_datapoints() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				// create-account-ticket, 'create-property' and 'create-profile' not available.
				'goals',
				'accounts-properties-profiles',
				'properties-profiles',
				'profiles',
				'report',
			),
			$analytics->get_datapoints()
		);
	}

	/**
	 * @dataProvider data_parse_account_id
	 */
	public function test_parse_account_id( $property_id, $expected ) {
		$class  = new \ReflectionClass( Analytics::class );
		$method = $class->getMethod( 'parse_account_id' );
		$method->setAccessible( true );

		$result = $method->invokeArgs(
			new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ),
			array( $property_id )
		);
		$this->assertSame( $expected, $result );
	}

	public function data_parse_account_id() {
		return array(
			array(
				'UA-2358017-2',
				'2358017',
			),
			array(
				'UA-13572468-4',
				'13572468',
			),
			array(
				'UA-13572468',
				'',
			),
			array(
				'GTM-13572468',
				'',
			),
			array(
				'13572468',
				'',
			),
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Service_Entity
	 */
	protected function get_module_with_service_entity() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_parse_reporting_orderby() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$reflected_parse_reporting_orderby_method = new ReflectionMethod( 'Google\Site_Kit\Modules\Analytics', 'parse_reporting_orderby' );
		$reflected_parse_reporting_orderby_method->setAccessible( true );

		// When there is no orderby in the request.
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, array() );
		$this->assertTrue( is_array( $result ) );
		$this->assertEmpty( $result );

		// When a single order object is used.
		$order  = array(
			'fieldName' => 'views',
			'sortOrder' => 'ASCENDING',
		);
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, $order );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 1, count( $result ) );
		$this->assertTrue( $result[0] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'views', $result[0]->getFieldName() );
		$this->assertEquals( 'ASCENDING', $result[0]->getSortOrder() );

		// When multiple orders are passed.
		$orders = array(
			array(
				'fieldName' => 'pages',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => 'sessions',
				'sortOrder' => 'ASCENDING',
			),
		);
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertTrue( $result[0] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'pages', $result[0]->getFieldName() );
		$this->assertEquals( 'DESCENDING', $result[0]->getSortOrder() );
		$this->assertTrue( $result[1] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'sessions', $result[1]->getFieldName() );
		$this->assertEquals( 'ASCENDING', $result[1]->getSortOrder() );

		// Check that it skips invalid orders.
		$orders = array(
			array(
				'fieldName' => 'views',
				'sortOrder' => '',
			),
			array(
				'fieldName' => 'pages',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => '',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => 'sessions',
				'sortOrder' => 'ASCENDING',
			),
		);
		$result = $reflected_parse_reporting_orderby_method->invoke( $analytics, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertTrue( $result[0] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'pages', $result[0]->getFieldName() );
		$this->assertEquals( 'DESCENDING', $result[0]->getSortOrder() );
		$this->assertTrue( $result[1] instanceof Google_Service_AnalyticsReporting_OrderBy );
		$this->assertEquals( 'sessions', $result[1]->getFieldName() );
		$this->assertEquals( 'ASCENDING', $result[1]->getSortOrder() );
	}

	public function test_create_analytics_site_data_request() {
		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$analytics = new Analytics( $context );

		$reflected_create_analytics_site_data_request_method = new ReflectionMethod( 'Google\Site_Kit\Modules\Analytics', 'create_analytics_site_data_request' );
		$reflected_create_analytics_site_data_request_method->setAccessible( true );

		$result = $reflected_create_analytics_site_data_request_method->invoke( $analytics, array() );
		$this->assertTrue( $result instanceof Google_Service_AnalyticsReporting_ReportRequest );

		$clauses = $result->getDimensionFilterClauses();
		$this->assertTrue( is_array( $clauses ) );
		$this->assertTrue( count( $clauses ) > 0 );

		$filters = $clauses[0]->getFilters();
		$this->assertTrue( is_array( $filters ) );
		$this->assertEquals( 1, count( $filters ) );
		$this->assertEquals( 'ga:hostname', $filters[0]->getDimensionName() );
		$this->assertEquals( 'IN_LIST', $filters[0]->getOperator() );

		$hostname    = wp_parse_url( $context->get_reference_site_url(), PHP_URL_HOST );
		$expressions = $filters[0]->getExpressions();

		$this->assertTrue( is_array( $expressions ) );
		$this->assertEquals( 2, count( $expressions ) );
		$this->assertContains( $hostname, $expressions );
		$this->assertContains( 'www.' . $hostname, $expressions );
	}

	public function test_handle_token_response_data() {
		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$analytics = new Analytics( $context );

		// Ensure settings are empty.
		$settings = $analytics->get_settings()->get();
		$this->assertEmpty( $settings['accountID'] );
		$this->assertEmpty( $settings['propertyID'] );
		$this->assertEmpty( $settings['internalWebPropertyID'] );
		$this->assertEmpty( $settings['profileID'] );

		$configuration = array(
			'ga_account_id'               => '12345678',
			'ua_property_id'              => 'UA-12345678-1',
			'ua_internal_web_property_id' => '13579',
			'ua_profile_id'               => '987654',
		);

		$analytics->handle_token_response_data(
			array(
				'analytics_configuration' => $configuration,
			)
		);

		// Ensure settings were set correctly.
		$settings = $analytics->get_settings()->get();
		$this->assertEquals( $configuration['ga_account_id'], $settings['accountID'] );
		$this->assertEquals( $configuration['ua_property_id'], $settings['propertyID'] );
		$this->assertEquals( $configuration['ua_internal_web_property_id'], $settings['internalWebPropertyID'] );
		$this->assertEquals( $configuration['ua_profile_id'], $settings['profileID'] );

		$analytics->handle_token_response_data(
			array(
				'analytics_configuration' => array(
					'ga_account_id'  => '12345678',
					'ua_property_id' => 'UA-12345678-1',
				),
			)
		);

		// Ensure settings haven't changed because insufficient configuration is passed.
		$settings = $analytics->get_settings()->get();
		$this->assertEquals( $configuration['ga_account_id'], $settings['accountID'] );
		$this->assertEquals( $configuration['ua_property_id'], $settings['propertyID'] );
		$this->assertEquals( $configuration['ua_internal_web_property_id'], $settings['internalWebPropertyID'] );
		$this->assertEquals( $configuration['ua_profile_id'], $settings['profileID'] );
	}

	public function test_get_debug_fields() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'analytics_account_id',
				'analytics_property_id',
				'analytics_profile_id',
				'analytics_use_snippet',
			),
			array_keys( $analytics->get_debug_fields() )
		);
	}

	public function test_get_debug_fields__ga4Reporting() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'analytics_account_id',
				'analytics_property_id',
				'analytics_profile_id',
				'analytics_use_snippet',
			),
			array_keys( $analytics->get_debug_fields() )
		);
	}

	/**
	 * @return Module_With_Data_Available_State
	 */
	protected function get_module_with_data_available_state() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

}
