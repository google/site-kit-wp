<?php
/**
 * Class Google\Site_Kit\Modules\AdSense
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Exception;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Screen_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit_Dependencies\Google_Service_AdSense;
use Google\Site_Kit_Dependencies\Google_Service_AdSense_Account;
use Google\Site_Kit_Dependencies\Google_Service_AdSense_Alert;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the AdSense module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class AdSense extends Module implements Module_With_Screen, Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Debug_Fields, Module_With_Owner {
	use Module_With_Screen_Trait, Module_With_Scopes_Trait, Module_With_Settings_Trait, Module_With_Assets_Trait, Module_With_Owner_Trait;

	/**
	 * Internal flag for whether the AdSense tag has been printed.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	private $adsense_tag_printed = false;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->register_screen_hook();

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
		add_action(
			'template_redirect',
			function() {
				// Bail early if we are checking for the tag presence from the back end.
				if ( $this->context->input()->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN ) ) {
					return;
				}

				$use_snippet = $this->get_data( 'use-snippet' );
				if ( is_wp_error( $use_snippet ) || ! $use_snippet ) {
					return;
				}

				$client_id = $this->get_data( 'client-id' );
				if ( is_wp_error( $client_id ) || ! $client_id ) {
					return;
				}

				// Web Stories support neither <amp-auto-ads> nor the script.
				// TODO: 'amp_story' support can be phased out in the long term.
				if ( is_singular( array( 'web-story', 'amp_story' ) ) ) {
					return;
				}

				// At this point, we know the tag should be rendered, so let's take care of it
				// for AMP and non-AMP.
				if ( $this->context->is_amp() ) {
					add_action( // For AMP Reader, and AMP Native and Transitional (if `wp_body_open` supported).
						'wp_body_open',
						function() use ( $client_id ) {
							$this->print_amp_auto_ads( $client_id );
						},
						-9999
					);

					add_filter( // For AMP Reader, and AMP Native and Transitional (as fallback).
						'the_content',
						function( $content ) use ( $client_id ) {
							return $this->amp_content_add_auto_ads( $content, $client_id );
						}
					);

					add_filter( // Load amp-auto-ads component for AMP Reader.
						'amp_post_template_data',
						function( $data ) {
							return $this->amp_data_load_auto_ads_component( $data );
						}
					);

					/**
					 * Fires when the AdSense tag for AMP has been initialized.
					 *
					 * This means that the tag will be rendered in the current request.
					 *
					 * @since 1.14.0
					 *
					 * @param string $client_id AdSense client ID used in the tag.
					 */
					do_action( 'googlesitekit_adsense_init_tag_amp', $client_id );
				} else {
					add_action( // For non-AMP.
						'wp_head',
						function() use ( $client_id ) {
							$this->output_adsense_script( $client_id );
						}
					);

					/**
					 * Fires when the AdSense tag has been initialized.
					 *
					 * This means that the tag will be rendered in the current request.
					 *
					 * @since 1.14.0
					 *
					 * @param string $client_id AdSense client ID used in the tag.
					 */
					do_action( 'googlesitekit_adsense_init_tag', $client_id );
				}
			}
		);
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
	 * Returns all module information data for passing it to JavaScript.
	 *
	 * @since 1.0.0
	 *
	 * @return array Module information data.
	 */
	public function prepare_info_for_js() {
		$info = parent::prepare_info_for_js();

		$info['provides'] = array(
			__( 'Monetize your website', 'google-site-kit' ),
			__( 'Intelligent, automatic ad placement', 'google-site-kit' ),
		);

		// Clear datapoints that don't need to be localized.
		$idenfifier_args = array(
			'source' => 'site-kit',
			'url'    => rawurlencode( $this->context->get_reference_site_url() ),
		);

		$signup_args = array(
			'utm_source' => 'site-kit',
			'utm_medium' => 'wordpress_signup',
		);

		$info['accountURL'] = add_query_arg( $idenfifier_args, $this->get_data( 'account-url' ) );
		$info['signupURL']  = add_query_arg( $signup_args, $info['accountURL'] );
		$info['rootURL']    = add_query_arg( $idenfifier_args, 'https://www.google.com/adsense/' );

		return $info;
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
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Outputs the AdSense script tag.
	 *
	 * @since 1.0.0
	 * @since 1.14.0 The `$client_id` parameter was added.
	 *
	 * @param string $client_id AdSense client ID to use in the snippet.
	 */
	protected function output_adsense_script( $client_id ) {
		if ( $this->adsense_tag_printed ) {
			return;
		}

		$this->adsense_tag_printed = true;

		// If we haven't completed the account connection yet, we still insert the AdSense tag
		// because it is required for account verification.
		?>
<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script> <?php // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript ?>
<script>
(adsbygoogle = window.adsbygoogle || []).push({
google_ad_client: "<?php echo esc_attr( $client_id ); ?>",
enable_page_level_ads: true,
tag_partner: "site_kit"
});
</script>
		<?php
	}

	/**
	 * Outputs the <amp-auto-ads> tag.
	 *
	 * @since 1.14.0
	 *
	 * @param string $client_id AdSense client ID to use in the snippet.
	 */
	protected function print_amp_auto_ads( $client_id ) {
		if ( $this->adsense_tag_printed ) {
			return;
		}

		$this->adsense_tag_printed = true;

		?>
		<amp-auto-ads type="adsense" data-ad-client="<?php echo esc_attr( $client_id ); ?>"></amp-auto-ads>
		<?php
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
			'adsense_account_id'     => array(
				'label' => __( 'AdSense account ID', 'google-site-kit' ),
				'value' => $settings['accountID'],
				'debug' => Debug_Data::redact_debug_value( $settings['accountID'], 7 ),
			),
			'adsense_client_id'      => array(
				'label' => __( 'AdSense client ID', 'google-site-kit' ),
				'value' => $settings['clientID'],
				'debug' => Debug_Data::redact_debug_value( $settings['clientID'], 10 ),
			),
			'adsense_account_status' => array(
				'label' => __( 'AdSense account status', 'google-site-kit' ),
				'value' => $settings['accountStatus'],
			),
			'adsense_use_snippet'    => array(
				'label' => __( 'AdSense snippet placed', 'google-site-kit' ),
				'value' => $settings['useSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useSnippet'] ? 'yes' : 'no',
			),
		);
	}

	/**
	 * Adds AMP auto ads script if opted in.
	 *
	 * This only affects AMP Reader mode, the others are automatically covered.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data AMP template data.
	 * @return array Filtered $data.
	 */
	protected function amp_data_load_auto_ads_component( $data ) {
		$data['amp_component_scripts']['amp-auto-ads'] = 'https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js';
		return $data;
	}

	/**
	 * Adds the AMP auto ads tag if opted in.
	 *
	 * @since 1.0.0
	 * @since 1.14.0 The `$client_id` parameter was added.
	 *
	 * @param string $content   The page content.
	 * @param string $client_id AdSense client ID to use in the snippet.
	 * @return string Filtered $content.
	 */
	protected function amp_content_add_auto_ads( $content, $client_id ) {
		if ( $this->adsense_tag_printed ) {
			return $content;
		}

		$this->adsense_tag_printed = true;
		return '<amp-auto-ads type="adsense" data-ad-client="' . esc_attr( $client_id ) . '"></amp-auto-ads> ' . $content;
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
			'GET:account-id'      => array( 'service' => '' ),
			'POST:account-id'     => array( 'service' => '' ),
			'GET:account-status'  => array( 'service' => '' ),
			'POST:account-status' => array( 'service' => '' ),
			'GET:account-url'     => array( 'service' => '' ),
			'GET:accounts'        => array( 'service' => 'adsense' ),
			'GET:alerts'          => array( 'service' => 'adsense' ),
			'GET:client-id'       => array( 'service' => '' ),
			'POST:client-id'      => array( 'service' => '' ),
			'GET:clients'         => array( 'service' => 'adsense' ),
			'GET:connection'      => array( 'service' => '' ),
			'POST:connection'     => array( 'service' => '' ),
			'GET:earnings'        => array( 'service' => 'adsense' ),
			'GET:notifications'   => array( 'service' => '' ),
			'GET:reports-url'     => array( 'service' => '' ),
			'POST:setup-complete' => array( 'service' => '' ),
			'GET:tag-permission'  => array( 'service' => '' ),
			'GET:urlchannels'     => array( 'service' => 'adsense' ),
			'GET:use-snippet'     => array( 'service' => '' ),
			'POST:use-snippet'    => array( 'service' => '' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:account-id':
				return function() {
					$option = $this->get_settings()->get();
					if ( empty( $option['accountID'] ) ) {
						return new WP_Error( 'account_id_not_set', __( 'AdSense account ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
					}
					return $option['accountID'];
				};
			case 'POST:account-id':
				if ( ! isset( $data['accountID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
				}
				return function() use ( $data ) {
					$this->get_settings()->merge( array( 'accountID' => $data['accountID'] ) );
					return true;
				};
			case 'GET:account-status':
				return function() {
					$option = $this->get_settings()->get();
					if ( empty( $option['accountStatus'] ) ) {
						return new WP_Error( 'account_status_not_set', __( 'AdSense account status not set.', 'google-site-kit' ), array( 'status' => 404 ) );
					}
					return $option['accountStatus'];
				};
			case 'POST:account-status':
				if ( ! isset( $data['accountStatus'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountStatus' ), array( 'status' => 400 ) );
				}
				return function() use ( $data ) {
					$this->get_settings()->merge( array( 'accountStatus' => $data['accountStatus'] ) );
					return true;
				};
			case 'GET:account-url':
				return function() {
					$account_id = $this->get_data( 'account-id' );
					if ( ! is_wp_error( $account_id ) && $account_id && $this->authentication->profile()->has() ) {
						$profile_email = $this->authentication->profile()->get()['email'];
						return add_query_arg(
							array( 'authuser' => $profile_email ),
							sprintf( 'https://www.google.com/adsense/new/%s/home', $account_id )
						);
					}
					return 'https://www.google.com/adsense/signup/new';
				};
			case 'GET:accounts':
				$service = $this->get_service( 'adsense' );
				return $service->accounts->listAccounts();
			case 'GET:alerts':
				if ( ! isset( $data['accountID'] ) ) {
					$data['accountID'] = $this->get_data( 'account-id' );
					if ( is_wp_error( $data['accountID'] ) || ! $data['accountID'] ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
					}
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts_alerts->listAccountsAlerts( $data['accountID'] );
			case 'GET:client-id':
				return function() {
					$option = $this->get_settings()->get();
					if ( empty( $option['clientID'] ) ) {
						return new WP_Error( 'client_id_not_set', __( 'AdSense client ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
					}
					return $option['clientID'];
				};
			case 'POST:client-id':
				if ( ! isset( $data['clientID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ), array( 'status' => 400 ) );
				}
				return function() use ( $data ) {
					$this->get_settings()->merge( array( 'clientID' => $data['clientID'] ) );
					return true;
				};
			case 'GET:clients':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts_adclients->listAccountsAdclients( $data['accountID'] );
			case 'GET:connection':
				return function() {
					$option   = $this->get_settings()->get();
					$defaults = array(
						'accountID'     => '',
						'clientID'      => '',
						'accountStatus' => '',
					);
					return array_intersect_key( array_merge( $defaults, $option ), $defaults );
				};
			case 'POST:connection':
				return function() use ( $data ) {
					$this->get_settings()->merge(
						array(
							'accountID'     => $data['accountID'],
							'clientID'      => $data['clientID'],
							'accountStatus' => $data['accountStatus'],
						)
					);
					return true;
				};
			case 'GET:earnings':
				$start_date = $data['startDate'];
				$end_date   = $data['endDate'];
				if ( ! strtotime( $start_date ) || ! strtotime( $end_date ) ) {
					$dates = $this->date_range_to_dates( $data['dateRange'] ?: 'last-28-days' );
					if ( is_wp_error( $dates ) ) {
						return $dates;
					}

					list ( $start_date, $end_date ) = $dates;
				}

				$args = array(
					'start_date' => $start_date,
					'end_date'   => $end_date,
				);

				$metrics = $this->parse_string_list( $data['metrics'] );
				if ( ! empty( $metrics ) ) {
					$args['metrics'] = $metrics;
				}

				$dimensions = $this->parse_string_list( $data['dimensions'] );
				if ( ! empty( $dimensions ) ) {
					$args['dimensions'] = $dimensions;
				}

				$orderby = $this->parse_earnings_orderby( $data['orderby'] );
				if ( ! empty( $orderby ) ) {
					$args['sort'] = $orderby;
				}

				if ( ! empty( $data['limit'] ) ) {
					$args['limit'] = $data['limit'];
				}

				return $this->create_adsense_earning_data_request( array_filter( $args ) );
			case 'GET:notifications':
				return function() {
					$alerts = $this->get_data( 'alerts' );
					if ( is_wp_error( $alerts ) || empty( $alerts ) ) {
						return array();
					}
					$alerts = array_filter(
						$alerts,
						function( Google_Service_AdSense_Alert $alert ) {
							return 'SEVERE' === $alert->getSeverity();
						}
					);

					// There is no SEVERE alert, return empty.
					if ( empty( $alerts ) ) {
						return array();
					}

					/**
					 * First Alert
					 *
					 * @var Google_Service_AdSense_Alert $alert
					 */
					$alert = array_shift( $alerts );
					return array(
						array(
							'id'            => 'adsense-notification',
							'description'   => $alert->getMessage(),
							'isDismissible' => true,
							'winImage'      => 'sun-small.png',
							'format'        => 'large',
							'severity'      => 'win-info',
							'ctaURL'        => $this->get_data( 'account-url' ),
							'ctaLabel'      => __( 'Go to AdSense', 'google-site-kit' ),
							'ctaTarget'     => '_blank',
						),
					);
				};
			case 'GET:tag-permission':
				return function() use ( $data ) {
					if ( ! isset( $data['clientID'] ) ) {
						return new WP_Error(
							'missing_required_param',
							/* translators: %s: Missing parameter name */
							sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ),
							array( 'status' => 400 )
						);
					}

					return array_merge(
						array( 'clientID' => $data['clientID'] ),
						$this->has_access_to_client( $data['clientID'] )
					);
				};
			case 'GET:reports-url':
				return function() {
					$account_id = $this->get_data( 'account-id' );
					if ( ! is_wp_error( $account_id ) && $account_id && $this->authentication->profile()->has() ) {
						$profile_email = $this->authentication->profile()->get()['email'];
						return add_query_arg(
							array( 'authuser' => $profile_email ),
							sprintf( 'https://www.google.com/adsense/new/%s/main/viewreports', $account_id )
						);
					}
					return 'https://www.google.com/adsense/start';
				};
			case 'POST:setup-complete':
				if ( ! isset( $data['clientID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ), array( 'status' => 400 ) );
				}
				return function() use ( $data ) {
					$this->get_settings()->merge(
						array(
							'accountSetupComplete' => true,
							'siteSetupComplete'    => true,
							'clientID'             => $data['clientID'],
							'useSnippet'           => $data['useSnippet'],
						)
					);

					return true;
				};
			case 'GET:urlchannels':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				if ( ! isset( $data['clientID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ),
						array( 'status' => 400 )
					);
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts_urlchannels->listAccountsUrlchannels( $data['accountID'], $data['clientID'] );
			case 'GET:use-snippet':
				return function() {
					$option = $this->get_settings()->get();

					return ! empty( $option['useSnippet'] );
				};
			case 'POST:use-snippet':
				if ( ! isset( $data['useSnippet'] ) ) {
					return new WP_Error(
						'missing_required_param',
						sprintf(
						/* translators: %s: Missing parameter name */
							__( 'Request parameter is empty: %s.', 'google-site-kit' ),
							'useSnippet'
						),
						array( 'status' => 400 )
					);
				}

				return function() use ( $data ) {
					$this->get_settings()->merge( array( 'useSnippet' => $data['useSnippet'] ) );

					return true;
				};
		}

		throw new Invalid_Datapoint_Exception();
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:accounts':
				$accounts = $response->getItems();
				// TODO: Remove this ugly side-effect once no longer used.
				if ( $data['maybeSetAccount'] && ! empty( $accounts ) ) {
					$account_id = $this->get_data( 'account-id' );
					if ( is_wp_error( $account_id ) || ! $account_id ) {
						$this->set_data( 'account-id', array( 'accountID' => $accounts[0]->id ) );
					}
				}
				return $accounts;

			// Intentional fallthrough.
			case 'GET:alerts':
			case 'GET:clients':
			case 'GET:urlchannels':
				return $response->getItems();
			case 'GET:earnings':
				return $response;
		}

		return $response;
	}

	/**
	 * Parses the orderby value of the data request into an array of earning orderby format.
	 *
	 * @since 1.15.0
	 *
	 * @param array|null $orderby Data request orderby value.
	 * @return string[] An array of reporting orderby strings.
	 */
	protected function parse_earnings_orderby( $orderby ) {
		if ( empty( $orderby ) || ! is_array( $orderby ) ) {
			return array();
		}

		$results = array_map(
			function ( $order_def ) {
				$order_def = array_merge(
					array(
						'fieldName' => '',
						'sortOrder' => '',
					),
					(array) $order_def
				);

				if ( empty( $order_def['fieldName'] ) || empty( $order_def['sortOrder'] ) ) {
					return null;
				}

				return ( 'ASCENDING' === $order_def['sortOrder'] ? '+' : '-' ) . $order_def['fieldName'];
			},
			// When just object is passed we need to convert it to an array of objects.
			wp_is_numeric_array( $orderby ) ? $orderby : array( $orderby )
		);

		$results = array_filter( $results );
		$results = array_values( $results );

		return $results;
	}

	/**
	 * Gets an array of dates for the given named date range.
	 *
	 * @param string $date_range Named date range.
	 *                           E.g. 'last-28-days'.
	 *
	 * @return array|WP_Error Array of [startDate, endDate] or WP_Error if invalid named range.
	 */
	private function date_range_to_dates( $date_range ) {
		switch ( $date_range ) {
			case 'today':
				return array(
					gmdate( 'Y-m-d', strtotime( 'today' ) ),
					gmdate( 'Y-m-d', strtotime( 'today' ) ),
				);
			case 'yesterday':
				return array(
					gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
				);
			case 'same-day-last-week':
				return array(
					gmdate( 'Y-m-d', strtotime( '7 days ago' ) ),
					gmdate( 'Y-m-d', strtotime( '7 days ago' ) ),
				);
			case 'this-month':
				return array(
					gmdate( 'Y-m-01' ),
					gmdate( 'Y-m-d', strtotime( 'today' ) ),
				);
			case 'this-month-last-year':
				$last_year          = intval( gmdate( 'Y' ) ) - 1;
				$last_date_of_month = gmdate( 't', strtotime( $last_year . '-' . gmdate( 'm' ) . '-01' ) );

				return array(
					gmdate( $last_year . '-m-01' ),
					gmdate( $last_year . '-m-' . $last_date_of_month ),
				);
			case 'prev-7-days':
				return array(
					gmdate( 'Y-m-d', strtotime( '14 days ago' ) ),
					gmdate( 'Y-m-d', strtotime( '8 days ago' ) ),
				);
			case 'prev-28-days':
				return array(
					gmdate( 'Y-m-d', strtotime( '56 days ago' ) ),
					gmdate( 'Y-m-d', strtotime( '29 days ago' ) ),
				);
			// Intentional fallthrough.
			case 'last-7-days':
			case 'last-14-days':
			case 'last-28-days':
			case 'last-90-days':
				return $this->parse_date_range( $date_range );
		}

		return new WP_Error( 'invalid_date_range', __( 'Invalid date range.', 'google-site-kit' ) );
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

		$account_id = $this->get_data( 'account-id' );
		if ( is_wp_error( $account_id ) ) {
			return $account_id;
		}

		$opt_params = array(
			'locale' => get_locale(),
			'metric' => array( 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ),
		);

		if ( ! empty( $args['dimensions'] ) ) {
			$opt_params['dimension'] = (array) $args['dimensions'];
		}

		if ( ! empty( $args['metrics'] ) ) {
			$opt_params['metric'] = (array) $args['metrics'];
		}

		if ( ! empty( $args['sort'] ) ) {
			$opt_params['sort'] = (array) $args['sort'];
		}

		if ( ! empty( $args['limit'] ) ) {
			$opt_params['maxResults'] = (int) $args['limit'];
		}

		$host = wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST );
		if ( ! empty( $host ) ) {
			$opt_params['filter'] = 'DOMAIN_NAME==' . $host;
		}

		$service = $this->get_service( 'adsense' );
		return $service->accounts_reports->generate( $account_id, $args['start_date'], $args['end_date'], $opt_params );
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
			'slug'        => 'adsense',
			'name'        => _x( 'AdSense', 'Service name', 'google-site-kit' ),
			'description' => __( 'Earn money by placing ads on your website. It’s free and easy.', 'google-site-kit' ),
			'cta'         => __( 'Monetize Your Site.', 'google-site-kit' ),
			'order'       => 2,
			'homepage'    => add_query_arg( $idenfifier_args, $this->get_data( 'reports-url' ) ),
			'learn_more'  => __( 'https://www.google.com/intl/en_us/adsense/start/', 'google-site-kit' ),
			'group'       => __( 'Additional Google Services', 'google-site-kit' ),
			'tags'        => array( 'monetize' ),
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
			'adsense' => new Google_Service_AdSense( $client ),
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
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
					),
				)
			),
		);
	}

	/**
	 * Verifies that user has access to the given client and account.
	 *
	 * @since 1.9.0
	 *
	 * @param string $client_id  Client found in the existing tag.
	 * @return array {
	 *      AdSense account access data.
	 *      @type string $account_id The AdSense account ID for the given client.
	 *      @type bool   $permission Whether the user has access to this account and client.
	 * }
	 */
	protected function has_access_to_client( $client_id ) {
		if ( empty( $client_id ) ) {
			return array(
				'account_id' => '',
				'permission' => false,
			);
		}

		$account_has_client = function ( $account_id ) use ( $client_id ) {
			// Try to get clients for that account.
			$clients = $this->get_data( 'clients', array( 'accountID' => $account_id ) );
			if ( is_wp_error( $clients ) ) {
				// No access to the account.
				return false;
			}
			// Ensure there is access to the client.
			foreach ( $clients as $client ) {
				if ( $client->getId() === $client_id ) {
					return true;
				}
			}

			return false;
		};

		$parsed_account_id = $this->parse_account_id( $client_id );

		if ( $account_has_client( $parsed_account_id ) ) {
			return array(
				'account_id' => $parsed_account_id,
				'permission' => true,
			);
		}

		$accounts = $this->get_data( 'accounts' );
		if ( is_wp_error( $accounts ) ) {
			$accounts = array();
		}

		foreach ( $accounts as $account ) {
			/* @var Google_Service_AdSense_Account $account AdSense account instance. */
			if ( $account->getId() === $parsed_account_id ) {
				continue;
			}
			if ( $account_has_client( $account->getId() ) ) {
				return array(
					'account_id' => $account->getId(),
					'permission' => true,
				);
			}
		}

		return array(
			'account_id' => $parsed_account_id,
			'permission' => false,
		);
	}

	/**
	 * Determines the AdSense account ID from a given AdSense client ID.
	 *
	 * @since 1.9.0
	 *
	 * @param string $client_id AdSense client ID.
	 * @return string AdSense account ID, or empty string if invalid client ID.
	 */
	protected function parse_account_id( $client_id ) {
		if ( ! preg_match( '/^ca-(pub-[0-9]+)$/', $client_id, $matches ) ) {
			return '';
		}
		return $matches[1];
	}
}
