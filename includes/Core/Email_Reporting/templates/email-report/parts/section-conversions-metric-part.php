<?php
/**
 * Conversion metrics template part.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array    $data               Conversion metric data.
 * @var string   $top_traffic_channel Top traffic channel driving conversions.
 * @var callable $render_part        Function to render a template part by name.
 * @var callable $render_shared_part Function to render a shared part by name.
 * @var callable $get_asset_url      Function to get asset URLs.
 */

$value          = $data['value'];
$label          = $data['label'];
$event_name     = $data['event_name'];
$change         = $data['change'];
$change_context = $data['change_context'];
?>
<table role="presentation" width="100%" style="margin-bottom:16px;">
	<tr>
		<td>
			<?php
			$render_part(
				'conversions-timeline',
				array(
					'change'        => $change,
					'get_asset_url' => $get_asset_url,
				)
			);
			?>
		</td>
		<td>
			<div style="font-size:16px; line-height:24px; font-weight:500; margin-bottom:6px;">
				<?php echo esc_html( $label ); ?>
			</div>
			<div style="height: 22px; margin-bottom: 16px;">
				&nbsp;
				<?php // TODO: Add detected in tag in v1. ?>
			</div>

			<table role="presentation" width="100%" style="padding-bottom: 10px; border-bottom: 1px solid #EBEEF0; margin-bottom: 10px;">
				<tr>
					<td style="font-size:12px; font-weight:500; color:#6C726E; text-align: left; padding-bottom: 10px;">
						<?php
						printf(
							/* translators: %s: Event name (e.g., "Purchase") */
							esc_html__( '"%s" events', 'google-site-kit' ),
							// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Event name is already escaped above.
							ucfirst( $event_name )
						);
						?>
					</td>
					<td width="110" style="font-size:12px; font-weight:500;  color:#6C726E; text-align: right; width: 110px; padding-bottom: 10px;">
						<?php echo esc_html( $change_context ); ?>
					</td>
				</tr>
				<tr>
					<td>
						<div style="font-size:14px; line-height:20px; font-weight:500;">
							<?php echo esc_html( $value ); ?>
						</div>
					</td>
					<td style="text-align: right;">
						<?php
						$render_shared_part(
							'change-badge',
							array(
								'value' => $change,
							)
						);
						?>
					</td>
				</tr>
			</table>

			<?php if ( ! empty( $top_traffic_channel ) ) : ?>
				<div style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; margin-bottom:4px;">
					<?php esc_html_e( 'Top traffic channel driving the most conversions', 'google-site-kit' ); ?>
				</div>
				<div style="font-size:14px; line-height:20px; font-weight:500;">
					<?php echo esc_html( $top_traffic_channel ); ?>
				</div>
			<?php endif; ?>
		</td>
	</tr>
</table>

