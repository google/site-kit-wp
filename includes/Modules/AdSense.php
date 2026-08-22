<?php
/**
 * Class Google\Site_Kit\Modules\AdSense
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag;
use Google\Site_Kit\Modules\AdSense\AMP_Tag;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Modules\AdSense\Tag_Guard;
use Google\Site_Kit\Modules\AdSense\Auto_Ad_Guard;
use Google\Site_Kit\Modules\AdSense\Web_Tag;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Accounts;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Adunits;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Alerts;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Clients;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Notifications;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Report;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Sites;
use Google\Site_Kit\Modules\AdSense\Datapoints\Sync_Ad_Blocking_Recovery_Tags;
use Google\Site_Kit_Dependencies\Google\Service\Adsense as Google_Service_Adsense;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\AdSense\Tag_Matchers;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Prompts\Dismissed_Prompts;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\Guards\WP_Query_404_Guard;
use Google\Site_Kit\Core\Tracking\Feature_Metrics_Trait;
use Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag_Guard;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Web_Tag;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_AdSenseLinked;
use WP_Error;

/**
 * Class representing the AdSense module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class AdSense extends Module implements Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Debug_Fields, Module_With_Owner, Module_With_Service_Entity, Module_With_Deactivation, Module_With_Tag, Provides_Feature_Metrics {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Tag_Trait;
	use Feature_Metrics_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'adsense';

	/**
	 * Ad_Blocking_Recovery_Tag instance.
	 *
	 * @since 1.104.0
	 * @var Ad_Blocking_Recovery_Tag
	 */
	protected $ad_blocking_recovery_tag;

	/**
	 * Constructor.
	 *
	 * @since 1.104.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets  Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null,
		?User_Options $user_options = null,
		?Authentication $authentication = null,
		?Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );
		$this->ad_blocking_recovery_tag = new Ad_Blocking_Recovery_Tag( new Encrypted_Options( $this->options ) );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();
		$this->register_feature_metrics();

		$this->ad_blocking_recovery_tag->register();

		add_action( 'wp_head', $this->get_method_proxy_once( 'render_platform_meta_tags' ) );

		if ( $this->is_connected() ) {
			/**
			 * Release filter forcing unlinked state.
			 *
			 * This is hooked into 'init' (default priority of 10), so that it
			 * runs after the original filter is added.
			 *
			 * @see \Google\Site_Kit\Modules\Analytics::register()
			 * @see \Google\Site_Kit\Modules\Analytics\Settings::register()
			 */
			add_action(
				'googlesitekit_init',
				function () {
					remove_filter( 'googlesitekit_analytics_adsense_linked', '__return_false' );
				}
			);
		}

		// AdSense tag placement logic.
		add_action( 'template_redirect', array( $this, 'register_tag' ) );

		// Reset AdSense link settings in Analytics when accountID changes.
		$this->get_settings()->on_change(
			function ( $old_value, $new_value ) {
				if ( $old_value['accountID'] !== $new_value['accountID'] ) {
					$this->reset_analytics_adsense_linked_settings();
				}
				if ( ! empty( $new_value['accountSetupComplete'] ) && ! empty( $new_value['siteSetupComplete'] ) ) {
					do_action( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED );
				}
			}
		);

		// Set up the site reset hook to reset the ad blocking recovery notification.
		add_action( 'googlesitekit_reset', array( $this, 'reset_ad_blocking_recovery_notification' ) );
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.0.0
	 * @since 1.9.0 Changed to `adsense.readonly` variant.
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/adsense.readonly',
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$settings = $this->get_settings()->get();

		if ( empty( $settings['accountSetupComplete'] ) || empty( $settings['siteSetupComplete'] ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.0.0
	 * @since 1.106.0 Remove Ad Blocking Recovery Tag setting on deactivation.
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();

		$this->ad_blocking_recovery_tag->delete();

		// Reset AdSense link settings in Analytics.
		$this->reset_analytics_adsense_linked_settings();

		// Reset the ad blocking recovery notification.
		$this->reset_ad_blocking_recovery_notification();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		return array(
			'adsense_account_id'                       => array(
				'label' => __( 'AdSense: Account ID', 'google-site-kit' ),
				'value' => $settings['accountID'],
				'debug' => Debug_Data::redact_debug_value( $settings['accountID'], 7 ),
			),
			'adsense_client_id'                        => array(
				'label' => __( 'AdSense: Client ID', 'google-site-kit' ),
				'value' => $settings['clientID'],
				'debug' => Debug_Data::redact_debug_value( $settings['clientID'], 10 ),
			),
			'adsense_account_status'                   => array(
				'label' => __( 'AdSense: Account status', 'google-site-kit' ),
				'value' => $settings['accountStatus'],
			),
			'adsense_site_status'                      => array(
				'label' => __( 'AdSense: Site status', 'google-site-kit' ),
				'value' => $settings['siteStatus'],
			),
			'adsense_use_snippet'                      => array(
				'label' => __( 'AdSense: Snippet placed', 'google-site-kit' ),
				'value' => $settings['useSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useSnippet'] ? 'yes' : 'no',
			),
			'adsense_web_stories_adunit_id'            => array(
				'label' => __( 'AdSense: Web Stories Ad Unit ID', 'google-site-kit' ),
				'value' => $settings['webStoriesAdUnit'],
				'debug' => $settings['webStoriesAdUnit'],
			),
			'adsense_setup_completed_timestamp'        => array(
				'label' => __( 'AdSense: Setup completed at', 'google-site-kit' ),
				'value' => $settings['setupCompletedTimestamp'] ? date_i18n(
					get_option( 'date_format' ),
					$settings['setupCompletedTimestamp']
				) : __( 'Not available', 'google-site-kit' ),
				'debug' => $settings['setupCompletedTimestamp'],
			),
			'adsense_abr_use_snippet'                  => array(
				'label' => __(
					'AdSense: Ad Blocking Recovery snippet placed',
					'google-site-kit'
				),
				'value' => $settings['useAdBlockingRecoverySnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useAdBlockingRecoverySnippet'] ? 'yes' : 'no',
			),
			'adsense_abr_use_error_protection_snippet' => array(
				'label' => __(
					'AdSense: Ad Blocking Recovery error protection snippet placed',
					'google-site-kit'
				),
				'value' => $settings['useAdBlockingRecoveryErrorSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useAdBlockingRecoveryErrorSnippet'] ? 'yes' : 'no',
			),
			'adsense_abr_setup_status'                 => array(
				'label' => __(
					'AdSense: Ad Blocking Recovery setup status',
					'google-site-kit'
				),
				'value' => $this->get_ad_blocking_recovery_setup_status_label(
					$settings['adBlockingRecoverySetupStatus']
				),
				'debug' => $settings['adBlockingRecoverySetupStatus'],
			),
		);
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.12.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:accounts'                        => new Get_Accounts(
				array(
					'service' => function () {
						return $this->get_service( 'adsense' );
					},
				)
			),
			'GET:adunits'                         => new Get_Adunits(
				array(
					'service'  => function () {
						return $this->get_service( 'adsense' );
					},
					'settings' => $this->get_settings(),
				)
			),
			'GET:alerts'                          => new Get_Alerts(
				array(
					'service' => function () {
						return $this->get_service( 'adsense' );
					},
				)
			),
			'GET:clients'                         => new Get_Clients(
				array(
					'service' => function () {
						return $this->get_service( 'adsense' );
					},
				)
			),
			'GET:notifications'                   => new Get_Notifications(
				array(
					'settings'        => $this->get_settings(),
					'get_data'        => function ( $datapoint, $args = array() ) {
						return $this->get_data( $datapoint, $args );
					},
					'get_account_url' => function () {
						return $this->get_account_url();
					},
				)
			),
			'GET:report'                          => new Get_Report(
				array(
					'service'                             => function () {
						return $this->get_service( 'adsense' );
					},
					'shareable'                           => true,
					'is_shared_data_request'              => function ( $data_request ) {
						return $this->is_shared_data_request( $data_request );
					},
					'create_adsense_earning_data_request' => function ( $args ) {
						return $this->create_adsense_earning_data_request( $args );
					},
				)
			),
			'GET:sites'                           => new Get_Sites(
				array(
					'service' => function () {
						return $this->get_service( 'adsense' );
					},
				)
			),
			'POST:sync-ad-blocking-recovery-tags' => new Sync_Ad_Blocking_Recovery_Tags(
				array(
					'service'                  => function () {
						return $this->get_service( 'adsense' );
					},
					'settings'                 => $this->get_settings(),
					'ad_blocking_recovery_tag' => $this->ad_blocking_recovery_tag,
					'normalize_account_id'     => function ( $account_id ) {
						return self::normalize_account_id( $account_id );
					},
				)
			),
		);
	}

	/**
	 * Gets the service URL for the current account or signup if none.
	 *
	 * @since 1.25.0
	 *
	 * @return string
	 */
	protected function get_account_url() {
		$profile = $this->authentication->profile();
		$option  = $this->get_settings()->get();
		$query   = array(
			'source'     => 'site-kit',
			'utm_source' => 'site-kit',
			'utm_medium' => 'wordpress_signup',
			'url'        => rawurlencode( $this->context->get_reference_site_url() ),
		);

		if ( ! empty( $option['accountID'] ) ) {
			$url = sprintf( 'https://www.google.com/adsense/new/%s/home', $option['accountID'] );
		} else {
			$url = 'https://www.google.com/adsense/signup';
		}

		if ( $profile->has() ) {
			$query['authuser'] = $profile->get()['email'];
		}

		return add_query_arg( $query, $url );
	}


	/**
	 * Creates a new AdSense earning request for the current account, site and given arguments.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array  $dimensions List of request dimensions. Default empty array.
	 *     @type array  $metrics    List of request metrics. Default empty array.
	 *     @type string $start_date Start date in 'Y-m-d' format. Default empty string.
	 *     @type string $end_date   End date in 'Y-m-d' format. Default empty string.
	 *     @type int    $row_limit  Limit of rows to return. Default none (will be skipped).
	 * }
	 * @return RequestInterface|WP_Error AdSense earning request instance.
	 */
	protected function create_adsense_earning_data_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions' => array(),
				'metrics'    => array(),
				'start_date' => '',
				'end_date'   => '',
				'limit'      => '',
				'sort'       => array(),
			)
		);

		$option     = $this->get_settings()->get();
		$account_id = $option['accountID'];
		if ( empty( $account_id ) ) {
			return new WP_Error( 'account_id_not_set', __( 'AdSense account ID not set.', 'google-site-kit' ) );
		}

		list( $start_year, $start_month, $start_day ) = explode( '-', $args['start_date'] );
		list( $end_year, $end_month, $end_day )       = explode( '-', $args['end_date'] );

		$opt_params = array(
			// In the AdSense API v2, date parameters require the individual pieces to be specified as integers.
			// See https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate.
			'dateRange'       => 'CUSTOM',
			'startDate.year'  => (int) $start_year,
			'startDate.month' => (int) $start_month,
			'startDate.day'   => (int) $start_day,
			'endDate.year'    => (int) $end_year,
			'endDate.month'   => (int) $end_month,
			'endDate.day'     => (int) $end_day,
			'languageCode'    => $this->context->get_locale( 'site', 'language-code' ),
			// Include default metrics only for backward-compatibility.
			'metrics'         => array( 'ESTIMATED_EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ),
		);

		if ( ! empty( $args['dimensions'] ) ) {
			$opt_params['dimensions'] = (array) $args['dimensions'];
		}

		if ( ! empty( $args['metrics'] ) ) {
			$opt_params['metrics'] = (array) $args['metrics'];
		}

		if ( ! empty( $args['sort'] ) ) {
			$opt_params['orderBy'] = (array) $args['sort'];
		}

		if ( ! empty( $args['limit'] ) ) {
			$opt_params['limit'] = (int) $args['limit'];
		}

		// @see https://developers.google.com/adsense/management/reporting/filtering?hl=en#OR
		$site_hostname         = URL::parse( $this->context->get_reference_site_url(), PHP_URL_HOST );
		$opt_params['filters'] = join(
			',',
			array_map(
				function ( $hostname ) {
					return 'DOMAIN_NAME==' . $hostname;
				},
				URL::permute_site_hosts( $site_hostname )
			)
		);

		return $this->get_service( 'adsense' )
			->accounts_reports
			->generate(
				self::normalize_account_id( $account_id ),
				$opt_params
			);
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		$idenfifier_args = array(
			'source' => 'site-kit',
			'url'    => $this->context->get_reference_site_url(),
		);

		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'AdSense', 'Service name', 'google-site-kit' ),
			'description' => __( 'Earn money by placing ads on your website. It’s free and easy.', 'google-site-kit' ),
			'homepage'    => add_query_arg( $idenfifier_args, 'https://adsense.google.com/start' ),
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now requires Google_Site_Kit_Client instance.
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'adsense' => new Google_Service_Adsense( $client ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.2.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.9.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-adsense',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-adsense.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-feature-discovery',
						'googlesitekit-modules',
						'googlesitekit-notifications',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}

	/**
	 * Registers the AdSense tag.
	 *
	 * @since 1.24.0
	 * @since 1.119.0 Method made public.
	 */
	public function register_tag() {
		// TODO: 'amp_story' support can be phased out in the long term.
		if ( is_singular( array( 'amp_story' ) ) ) {
			return;
		}

		$module_settings = $this->get_settings();
		$settings        = $module_settings->get();

		if ( $this->context->is_amp() ) {
			$tag = new AMP_Tag( $settings['clientID'], self::MODULE_SLUG );
			$tag->set_story_ad_slot_id( $settings['webStoriesAdUnit'] );
		} else {
			$tag = new Web_Tag( $settings['clientID'], self::MODULE_SLUG );
		}

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new WP_Query_404_Guard() );
		$tag->use_guard( new Tag_Guard( $module_settings ) );
		$tag->use_guard( new Auto_Ad_Guard( $module_settings ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( $tag->can_register() ) {
			$tag->register();
		}

		if ( ! $this->context->is_amp() ) {
			$ad_blocking_recovery_web_tag = new Ad_Blocking_Recovery_Web_Tag( $this->ad_blocking_recovery_tag, $settings['useAdBlockingRecoveryErrorSnippet'] );

			$ad_blocking_recovery_web_tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
			$ad_blocking_recovery_web_tag->use_guard( new WP_Query_404_Guard() );
			$ad_blocking_recovery_web_tag->use_guard( new Ad_Blocking_Recovery_Tag_Guard( $module_settings ) );
			$ad_blocking_recovery_web_tag->use_guard( new Tag_Environment_Type_Guard() );

			if ( $ad_blocking_recovery_web_tag->can_register() ) {
				$ad_blocking_recovery_web_tag->register();
			}
		}
	}

	/**
	 * Returns the Module_Tag_Matchers instance.
	 *
	 * @since 1.119.0
	 *
	 * @return Module_Tag_Matchers Module_Tag_Matchers instance.
	 */
	public function get_tag_matchers() {
		return new Tag_Matchers();
	}

	/**
	 * Normalizes account ID and returns it.
	 *
	 * @since 1.36.0
	 *
	 * @param string $account_id Account ID.
	 * @return string Updated account ID with "accounts/" prefix.
	 */
	public static function normalize_account_id( $account_id ) {
		return 'accounts/' . $account_id;
	}

	/**
	 * Normalizes ad client ID and returns it.
	 *
	 * @since 1.36.0
	 *
	 * @param string $account_id Account ID.
	 * @param string $client_id  Ad client ID.
	 * @return string Account ID and ad client ID in "accounts/{accountID}/adclients/{clientID}" format.
	 */
	public static function normalize_client_id( $account_id, $client_id ) {
		return 'accounts/' . $account_id . '/adclients/' . $client_id;
	}

	/**
	 * Outputs the Adsense for Platforms meta tags.
	 *
	 * @since 1.43.0
	 */
	private function render_platform_meta_tags() {
		printf( "\n<!-- %s -->\n", esc_html__( 'Google AdSense meta tags added by Site Kit', 'google-site-kit' ) );
		echo '<meta name="google-adsense-platform-account" content="ca-host-pub-2644536267352236">';
		echo "\n";
		echo '<meta name="google-adsense-platform-domain" content="sitekit.withgoogle.com">';
		printf( "\n<!-- %s -->\n", esc_html__( 'End Google AdSense meta tags added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Checks if the current user has access to the current configured service entity.
	 *
	 * @since 1.70.0
	 *
	 * @return boolean|WP_Error
	 */
	public function check_service_entity_access() {
		$data_request = array(
			'start_date' => gmdate( 'Y-m-d' ),
			'end_date'   => gmdate( 'Y-m-d' ),
			'limit'      => 1,
		);

		try {
			$request = $this->create_adsense_earning_data_request( $data_request );

			if ( is_wp_error( $request ) ) {
				return $request;
			}
		} catch ( Exception $e ) {
			if ( $e->getCode() === 403 ) {
				return false;
			}
			return $this->exception_to_error( $e );
		}

		return true;
	}


	/**
	 * Gets the Ad Blocking Recovery setup status label.
	 *
	 * @since 1.107.0
	 *
	 * @param string $setup_status The saved raw setting.
	 * @return string The status label based on the raw setting.
	 */
	private function get_ad_blocking_recovery_setup_status_label( $setup_status ) {
		switch ( $setup_status ) {
			case Settings::AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED:
				return __( 'Snippet is placed', 'google-site-kit' );
			case Settings::AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED:
				return __( 'Setup complete', 'google-site-kit' );
			default:
				return __( 'Not set up', 'google-site-kit' );
		}
	}

	/**
	 * Resets the AdSense linked settings in the Analytics module.
	 *
	 * @since 1.120.0
	 */
	protected function reset_analytics_adsense_linked_settings() {
		$analytics_settings = new Analytics_Settings( $this->options );

		if ( ! $analytics_settings->has() ) {
			return;
		}

		$analytics_settings->merge(
			array(
				'adSenseLinked'             => false,
				'adSenseLinkedLastSyncedAt' => 0,
			)
		);
	}

	/**
	 * Resets the Ad Blocking Recovery notification.
	 *
	 * @since 1.121.0
	 */
	public function reset_ad_blocking_recovery_notification() {
		$dismissed_prompts = ( new Dismissed_Prompts( $this->user_options ) );

		$current_dismissals = $dismissed_prompts->get();

		if ( isset( $current_dismissals['ad-blocking-recovery-notification'] ) && $current_dismissals['ad-blocking-recovery-notification']['count'] < 3 ) {
			$dismissed_prompts->remove( 'ad-blocking-recovery-notification' );
		}
	}

	/**
	 * Gets an array of internal feature metrics.
	 *
	 * @since 1.163.0
	 *
	 * @return array
	 */
	public function get_feature_metrics() {
		return array(
			'adsense_abr_status' => $this->is_connected() ? $this->get_settings()->get()['adBlockingRecoverySetupStatus'] : '',
		);
	}
}
