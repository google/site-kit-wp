<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Reset_AudiencesTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Prompts\Dismissed_Prompts;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Reset_Audiences;
use Google\Site_Kit\Tests\TestCase;

/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Reset_AudiencesTest
 *
 * @group Modules
 * @group Analytics
 */
class Reset_AudiencesTest extends TestCase {

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Array of User objects.
	 *
	 * @var array
	 */
	private $users;

	/**
	 * User Options object.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Dismissed_Prompts instance.
	 *
	 * @var Dismissed_Prompts
	 */
	protected $dismissed_prompts;

	/**
	 * Dismissed_Items instance.
	 *
	 * @var Dismissed_Items
	 */
	protected $dismissed_items;

	/**
	 * Authentication object.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Analytics 4 object.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Audience Settings instance.
	 *
	 * @var Audience_Settings
	 */
	protected $audience_settings;

	public function set_up() {
		parent::set_up();

		$this->context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options           = new Options( $this->context );
		$this->users             = array( $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) ), $this->factory()->user->create_and_get( array( 'role' => 'editor' ) ) );
		$this->user_options      = new User_Options( $this->context, $this->users[0]->ID );
		$this->dismissed_prompts = new Dismissed_Prompts( $this->user_options );
		$this->dismissed_items   = new Dismissed_Items( $this->user_options );
		$this->audience_settings = new Audience_Settings( $this->user_options );
		$this->authentication    = new Authentication( $this->context, $this->options, $this->user_options );
		$this->analytics         = new Analytics_4( $this->context, $this->options, $this->user_options, $this->authentication );

		$this->analytics->register();
		wp_set_current_user( $this->users[0]->ID );

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => 'UA-111111',
			),
		);
	}

	public function test_reset_audience_data() {
		$backup_user_id = $this->user_options->get_user_id();

		$default_user_audience_settings = array(
			'configuredAudiences'                => null,
			'isAudienceSegmentationWidgetHidden' => false,
			'didSetAudiences'                    => false,
		);

		$activated_user_audience_settings = array(
			'configuredAudiences'                => array(
				'properties/12345678/audiences/12345',
				'properties/12345678/audiences/67890',
			),
			'isAudienceSegmentationWidgetHidden' => true,
			'didSetAudiences'                    => true,
		);

		// Set up test dismissed items.
		$test_dismissed_items = array_merge(
			Reset_Audiences::AUDIENCE_SEGMENTATION_DISMISSED_ITEMS,
			array(
				'audience-tile-testAudienceTile1',
				'audience-tile-testAudienceTile2',
			)
		);
		// Remove the wildcard key, as we have added test examples above.
		unset( $test_dismissed_items[ array_search( 'audience-tile-*', $test_dismissed_items, true ) ] );

		$default_audience_segmentation_settings = array(
			'availableAudiences'                => null,
			'availableAudiencesLastSyncedAt'    => 0,
			'audienceSegmentationSetupComplete' => false,
		);

		$activated_audience_segmentation_settings = array(
			'availableAudiences'                => array(
				array(
					'name' => 'properties/12345678/audiences/12345',
				),
				array(
					'name' => 'properties/12345678/audiences/67890',
				),
			),
			'availableAudiencesLastSyncedAt'    => time(),
			'audienceSegmentationSetupComplete' => true,
		);

		// Set module level audience settings.
		$this->analytics->get_settings()->merge(
			$activated_audience_segmentation_settings
		);
		$analytics_settings = $this->analytics->get_settings()->get();

		var_dump( '$analytics_settings' );
		var_dump( $analytics_settings );
		var_dump( '$activated_audience_segmentation_settings' );
		var_dump( $activated_audience_segmentation_settings );

		foreach ( array_keys( $default_audience_segmentation_settings ) as $key ) {
			$this->assertEquals( $activated_audience_segmentation_settings[ $key ], $analytics_settings[ $key ] );
		}

		foreach ( $this->users as $user ) {
			$this->user_options->switch_user( $user->ID );

			// Give each user some dismissed prompts.
			foreach ( Reset_Audiences::AUDIENCE_SEGMENTATION_DISMISSED_PROMPTS as $dismissed_prompt ) {
				$this->dismissed_prompts->add( $dismissed_prompt );
			}
			$user_dismissed_prompts = $this->dismissed_prompts->get();
			foreach ( Reset_Audiences::AUDIENCE_SEGMENTATION_DISMISSED_PROMPTS as $dismissed_prompt ) {
				$this->assertTrue( array_key_exists( $dismissed_prompt, $user_dismissed_prompts ) );
			}

			// Give each user some dismissed items.
			foreach ( $test_dismissed_items as $dismissed_item ) {
				$this->dismissed_items->add( $dismissed_item );
			}
			$user_dismissed_items = $this->dismissed_items->get();
			foreach ( $test_dismissed_items as $dismissed_item ) {
				$this->assertTrue( array_key_exists( $dismissed_item, $user_dismissed_items ) );
			}

			// Give each user some configured audiences.
			$this->audience_settings->merge(
				array(
					'configuredAudiences'                => $activated_user_audience_settings['configuredAudiences'],
					'isAudienceSegmentationWidgetHidden' => $activated_user_audience_settings['isAudienceSegmentationWidgetHidden'],
				)
			);
			$audience_settings = $this->audience_settings->get();
			foreach ( array_keys( $default_user_audience_settings ) as $key ) {
				$this->assertEquals( $activated_user_audience_settings[ $key ], $audience_settings[ $key ] );
			}
		}
		$this->user_options->switch_user( $backup_user_id );

		// Update the propertyID to trigger reset.
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => 'UA-222222',
			)
		);

		// Confirm the users dismissed prompts have been reset.
		foreach ( $this->users as $user ) {
			$this->user_options->switch_user( $user->ID );

			// Confirm the users dismissed prompts have been reset.
			$user_dismissed_prompts = $this->dismissed_prompts->get();
			foreach ( Reset_Audiences::AUDIENCE_SEGMENTATION_DISMISSED_PROMPTS as $dismissed_prompt ) {
				$this->assertFalse( array_key_exists( $dismissed_prompt, $user_dismissed_prompts ) );
			}

			// Confirm the users dismissed items have been reset.
			$user_dismissed_items = $this->dismissed_items->get();
			foreach ( $test_dismissed_items as $dismissed_item ) {
				$this->assertFalse( array_key_exists( $dismissed_item, $user_dismissed_items ) );
			}

			// Confirm the users audience settings have been reset.
			$audience_settings = $this->audience_settings->get();
			foreach ( array_keys( $default_user_audience_settings ) as $key ) {
					$this->assertEquals( $default_user_audience_settings[ $key ], $audience_settings[ $key ] );
			}
		}
		$this->user_options->switch_user( $backup_user_id );

		// Confirm the module level audience settings have been reset.
		$analytics_settings = $this->analytics->get_settings()->get();
		foreach ( array_keys( $default_audience_segmentation_settings ) as $key ) {
			$this->assertEquals( $default_audience_segmentation_settings[ $key ], $analytics_settings[ $key ] );
		}
	}
}
