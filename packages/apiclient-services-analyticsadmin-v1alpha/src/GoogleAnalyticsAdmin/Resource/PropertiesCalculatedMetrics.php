<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin\Resource;

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaCalculatedMetric;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListCalculatedMetricsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "calculatedMetrics" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $calculatedMetrics = $analyticsadminService->properties_calculatedMetrics;
 *  </code>
 */
class PropertiesCalculatedMetrics extends \Google\Service\Resource
{
  /**
   * Creates a CalculatedMetric. (calculatedMetrics.create)
   *
   * @param string $parent Required. Format: properties/{property_id} Example:
   * properties/1234
   * @param GoogleAnalyticsAdminV1alphaCalculatedMetric $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string calculatedMetricId Required. The ID to use for the
   * calculated metric which will become the final component of the calculated
   * metric's resource name. This value should be 1-80 characters and valid
   * characters are /[a-zA-Z0-9_]/, no spaces allowed. calculated_metric_id must
   * be unique between all calculated metrics under a property. The
   * calculated_metric_id is used when referencing this calculated metric from
   * external APIs, for example, "calcMetric:{calculated_metric_id}".
   * @return GoogleAnalyticsAdminV1alphaCalculatedMetric
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaCalculatedMetric $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaCalculatedMetric::class);
  }
  /**
   * Deletes a CalculatedMetric on a property. (calculatedMetrics.delete)
   *
   * @param string $name Required. The name of the CalculatedMetric to delete.
   * Format: properties/{property_id}/calculatedMetrics/{calculated_metric_id}
   * Example: properties/1234/calculatedMetrics/Metric01
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Lookup for a single CalculatedMetric. (calculatedMetrics.get)
   *
   * @param string $name Required. The name of the CalculatedMetric to get.
   * Format: properties/{property_id}/calculatedMetrics/{calculated_metric_id}
   * Example: properties/1234/calculatedMetrics/Metric01
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaCalculatedMetric
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaCalculatedMetric::class);
  }
  /**
   * Lists CalculatedMetrics on a property.
   * (calculatedMetrics.listPropertiesCalculatedMetrics)
   *
   * @param string $parent Required. Example format: properties/1234
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize Optional. The maximum number of resources to return.
   * If unspecified, at most 50 resources will be returned. The maximum value is
   * 200 (higher values will be coerced to the maximum).
   * @opt_param string pageToken Optional. A page token, received from a previous
   * `ListCalculatedMetrics` call. Provide this to retrieve the subsequent page.
   * When paginating, all other parameters provided to `ListCalculatedMetrics`
   * must match the call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListCalculatedMetricsResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesCalculatedMetrics($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListCalculatedMetricsResponse::class);
  }
  /**
   * Updates a CalculatedMetric on a property. (calculatedMetrics.patch)
   *
   * @param string $name Output only. Resource name for this CalculatedMetric.
   * Format: 'properties/{property_id}/calculatedMetrics/{calculated_metric_id}'
   * @param GoogleAnalyticsAdminV1alphaCalculatedMetric $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Omitted fields will not be updated. To replace the entire entity, use one
   * path with the string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaCalculatedMetric
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaCalculatedMetric $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaCalculatedMetric::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesCalculatedMetrics::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesCalculatedMetrics');
