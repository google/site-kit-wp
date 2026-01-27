<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Audience_UtilitiesTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Utilities;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaAudience;

class Audience_UtilitiesTest extends TestCase {

	/**
	 * @var Audience_Utilities
	 */
	private $audience_utilities;

	/**
	 * @var Audience_Settings
	 */
	private $audience_settings;

	public function set_up() {
		parent::set_up();
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->audience_settings = new Audience_Settings( $options );
		$this->audience_utilities = new Audience_Utilities( $this->audience_settings );
		$this->audience_settings->register();
	}

	public function test_set_available_audiences() {
		// Mock "All Users" (Default Audience).
		$audience_all_users = new GoogleAnalyticsAdminV1alphaAudience();
		$audience_all_users->setName( 'properties/123/audiences/1' );
		$audience_all_users->setDisplayName( 'All Users' );
		$audience_all_users->setDescription( 'All users' );

		// This audience is marked as a Site Kit audience by adding a filter clause.
		$audience_new_visitors = new GoogleAnalyticsAdminV1alphaAudience();
		$audience_new_visitors->setName( 'properties/123/audiences/2' );
		$audience_new_visitors->setDisplayName( 'New Visitors' );
		$filter_clause = array(
			'clauseType'   => 'INCLUDE',
			'simpleFilter' => array(
				'scope'            => 'AUDIENCE_FILTER_SCOPE_USER',
				'filterExpression' => array(
					'dimensionOrMetricFilter' => array(
						'fieldName'    => 'groupId',
						'stringFilter' => array(
							'value' => 'created_by_googlesitekit:new_visitors',
						),
					),
				),
			),
		);

		$audience_new_visitors->setFilterClauses( array( $filter_clause ) );

		// Mock "Custom Audience" (User Audience).
		$audience_custom = new GoogleAnalyticsAdminV1alphaAudience();
		$audience_custom->setName( 'properties/123/audiences/3' );
		$audience_custom->setDisplayName( 'My Custom Audience' );

		$audiences = array( $audience_all_users, $audience_new_visitors, $audience_custom );

		$processed = $this->audience_utilities->set_available_audiences( $audiences );

		$this->assertCount( 3, $processed, 'Should process 3 audiences.' );

		$this->assertEquals( 'My Custom Audience', $processed[0]['displayName'], 'User audience should be first.' );
		$this->assertEquals( 'USER_AUDIENCE', $processed[0]['audienceType'], 'First audience should be USER_AUDIENCE.' );

		$this->assertEquals( 'New Visitors', $processed[1]['displayName'], 'Site Kit audience should be second.' );
		$this->assertEquals( 'SITE_KIT_AUDIENCE', $processed[1]['audienceType'], 'Second audience should be SITE_KIT_AUDIENCE.' );

		$this->assertEquals( 'All visitors', $processed[2]['displayName'], 'Default audience should be last and renamed.' ); // "All Users" is renamed to "All visitors"
		$this->assertEquals( 'DEFAULT_AUDIENCE', $processed[2]['audienceType'], 'Last audience should be DEFAULT_AUDIENCE.' );

		$settings = $this->audience_settings->get();
		$this->assertEquals( $processed, $settings['availableAudiences'], 'Settings should be updated with processed audiences.' );
	}

	public function test_get_site_kit_audiences() {
		$audiences = array(
			array(
				'displayName'  => 'User Audience',
				'audienceType' => 'USER_AUDIENCE',
			),
			array(
				'displayName'  => 'New Visitors',
				'audienceType' => 'SITE_KIT_AUDIENCE',
			),
			array(
				'displayName'  => 'Returning Visitors',
				'audienceType' => 'SITE_KIT_AUDIENCE',
			),
			array(
				'displayName'  => 'All Users',
				'audienceType' => 'DEFAULT_AUDIENCE',
			),
		);

		$result = $this->audience_utilities->get_site_kit_audiences( $audiences );

		$this->assertCount( 2, $result, 'Should return 2 Site Kit audiences.' );
		$this->assertContains( 'New Visitors', $result, 'Result should contain New Visitors.' );
		$this->assertContains( 'Returning Visitors', $result, 'Result should contain Returning Visitors.' );
		$this->assertNotContains( 'User Audience', $result, 'Result should not contain User Audience.' );
		$this->assertNotContains( 'All Users', $result, 'Result should not contain All Users.' );
	}

	public function data_available_audiences() {
		$raw_audiences = json_decode(
			file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/audiences.json' ),
			true
		);

		$available_audiences = json_decode(
			file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/available-audiences.json' ),
			true
		);

		$raw_audience_default_all_users           = $raw_audiences[0];
		$raw_audience_default_purchasers          = $raw_audiences[1];
		$raw_audience_site_kit_new_visitors       = $raw_audiences[2];
		$raw_audience_site_kit_returning_visitors = $raw_audiences[3];
		$raw_audience_user_test                   = $raw_audiences[4];

		$available_audience_default_all_users           = $available_audiences[0];
		$available_audience_default_purchasers          = $available_audiences[1];
		$available_audience_site_kit_new_visitors       = $available_audiences[2];
		$available_audience_site_kit_returning_visitors = $available_audiences[3];
		$available_audience_user_test                   = $available_audiences[4];

		return array(
			'Site Kit audiences in correct order' => array(
				array(
					'raw_audiences' => array(
						$raw_audience_site_kit_new_visitors,
						$raw_audience_site_kit_returning_visitors,
					),
					'expected_available_audiences' => array(
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
					),
				),
			),
			'Site Kit audiences in incorrect order' => array(
				array(
					'raw_audiences' => array(
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_site_kit_new_visitors,
					),
					'expected_available_audiences' => array(
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
					),
				),
			),
			'default audiences, case 1' => array(
				array(
					'raw_audiences' => array(
						$raw_audience_default_all_users,
						$raw_audience_default_purchasers,
					),
					'expected_available_audiences' => array(
						$available_audience_default_all_users,
						$available_audience_default_purchasers,
					),
				),
			),
			'default audiences, case 2' => array(
				array(
					'raw_audiences' => array(
						$raw_audience_default_purchasers,
						$raw_audience_default_all_users,
					),
					'expected_available_audiences' => array(
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
			'all audiences, case 1' => array(
				array(
					'raw_audiences' => array(
						$raw_audience_user_test,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_default_all_users,
						$raw_audience_default_purchasers,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_all_users,
						$available_audience_default_purchasers,
					),
				),
			),
			'all audiences, case 2' => array(
				array(
					'raw_audiences' => array(
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_user_test,
						$raw_audience_default_purchasers,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_default_all_users,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
			'all audiences, case 3' => array(
				array(
					'raw_audiences' => array(
						$raw_audience_default_purchasers,
						$raw_audience_default_all_users,
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_user_test,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_available_audiences
	 */
	public function test_set_available_audiences_with_fixtures( $available_audiences ) {
		$raw_audiences                = $available_audiences['raw_audiences'];
		$expected_available_audiences = $available_audiences['expected_available_audiences'];

		$audiences = array_map(
			function ( $audience_data ) {
				return new GoogleAnalyticsAdminV1alphaAudience( $audience_data );
			},
			$raw_audiences
		);

		$processed = $this->audience_utilities->set_available_audiences( $audiences );

		$this->assertEquals( $expected_available_audiences, $processed, 'Processed audiences should match expected structure and order.' );
	}
}
