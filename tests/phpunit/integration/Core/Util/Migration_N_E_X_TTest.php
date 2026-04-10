<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_N_E_X_TTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings as Reader_Revenue_Manager_Settings;
use Google\Site_Kit\Tests\TestCase;

class Migration_N_E_X_TTest extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Reader_Revenue_Manager_Settings
	 */
	protected $rrm_settings;

	public function set_up() {
		parent::set_up();

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options      = new Options( $this->context );
		$this->rrm_settings = new Reader_Revenue_Manager_Settings( $this->options );

		$this->rrm_settings->register();
		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_N_E_X_T(
			$this->context,
			$this->options
		);
	}

	public function test_register() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ), 'Migration should register admin_init action.' );
	}

	public function test_migrate_content_policy_status() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'publicationID'              => 'test-pub-id',
			'publicationOnboardingState' => 'ONBOARDING_COMPLETE',
			'contentPolicyStatus'        => array(
				'contentPolicyState' => 'CONTENT_POLICY_VIOLATION_GRACE_PERIOD',
				'policyInfoLink'     => 'https://example.com/policy-info',
			),
		);

		$this->rrm_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->rrm_settings->get();

		$this->assertArrayNotHasKey( 'contentPolicyStatus', $post_migration_settings, 'Legacy contentPolicyStatus key should be removed after migration.' );
		$this->assertEquals( 'CONTENT_POLICY_VIOLATION_GRACE_PERIOD', $post_migration_settings['contentPolicyState'], 'contentPolicyState should be migrated from nested contentPolicyStatus.' );
		$this->assertEquals( 'https://example.com/policy-info', $post_migration_settings['policyInfoLink'], 'policyInfoLink should be migrated from nested contentPolicyStatus.' );
		$this->assertEquals( 'test-pub-id', $post_migration_settings['publicationID'], 'Other settings should be preserved after migration.' );
	}

	public function test_migrate_content_policy_status_with_empty_object() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'publicationID'              => 'test-pub-id',
			'publicationOnboardingState' => 'ONBOARDING_COMPLETE',
			'contentPolicyStatus'        => array(),
		);

		$this->rrm_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->rrm_settings->get();

		$this->assertArrayNotHasKey( 'contentPolicyStatus', $post_migration_settings, 'Legacy contentPolicyStatus key should be removed after migration.' );
		$this->assertEquals( '', $post_migration_settings['contentPolicyState'], 'contentPolicyState should default to empty string when not present in legacy data.' );
		$this->assertEquals( '', $post_migration_settings['policyInfoLink'], 'policyInfoLink should default to empty string when not present in legacy data.' );
	}

	public function test_migrate_skips_when_no_rrm_settings_exist() {
		$migration = $this->get_new_migration_instance();

		$migration->migrate();

		$this->assertOptionNotExists( Reader_Revenue_Manager_Settings::OPTION );
	}

	public function test_migrate_skips_when_no_legacy_content_policy_status() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'publicationID'              => 'test-pub-id',
			'publicationOnboardingState' => 'ONBOARDING_COMPLETE',
			'contentPolicyState'         => 'CONTENT_POLICY_VIOLATION_ENFORCEMENT',
			'policyInfoLink'             => 'https://example.com/policy-info',
		);

		$this->rrm_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->rrm_settings->get();

		$this->assertEquals( 'CONTENT_POLICY_VIOLATION_ENFORCEMENT', $post_migration_settings['contentPolicyState'], 'contentPolicyState should remain unchanged when no legacy data exists.' );
		$this->assertEquals( 'https://example.com/policy-info', $post_migration_settings['policyInfoLink'], 'policyInfoLink should remain unchanged when no legacy data exists.' );
	}

	public function test_migrate_sets_db_version() {
		$migration = $this->get_new_migration_instance();

		$migration->migrate();

		$this->assertEquals( Migration_N_E_X_T::DB_VERSION, $this->get_db_version(), 'DB version should be set after migration.' );
	}

	protected function get_db_version() {
		return $this->options->get( Migration_N_E_X_T::DB_VERSION_OPTION );
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_N_E_X_T::DB_VERSION_OPTION );
	}
}
