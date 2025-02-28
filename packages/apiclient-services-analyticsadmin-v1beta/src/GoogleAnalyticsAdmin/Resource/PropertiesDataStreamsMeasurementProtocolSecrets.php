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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaMeasurementProtocolSecret;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "measurementProtocolSecrets" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $measurementProtocolSecrets = $analyticsadminService->properties_dataStreams_measurementProtocolSecrets;
 *  </code>
 */
class PropertiesDataStreamsMeasurementProtocolSecrets extends \Google\Service\Resource
{
  /**
   * Creates a measurement protocol secret. (measurementProtocolSecrets.create)
   *
   * @param string $parent Required. The parent resource where this secret will be
   * created. Format: properties/{property}/dataStreams/{dataStream}
   * @param GoogleAnalyticsAdminV1betaMeasurementProtocolSecret $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1betaMeasurementProtocolSecret
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1betaMeasurementProtocolSecret $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1betaMeasurementProtocolSecret::class);
  }
  /**
   * Deletes target MeasurementProtocolSecret. (measurementProtocolSecrets.delete)
   *
   * @param string $name Required. The name of the MeasurementProtocolSecret to
   * delete. Format: properties/{property}/dataStreams/{dataStream}/measurementPro
   * tocolSecrets/{measurementProtocolSecret}
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
   * Lookup for a single MeasurementProtocolSecret.
   * (measurementProtocolSecrets.get)
   *
   * @param string $name Required. The name of the measurement protocol secret to
   * lookup. Format: properties/{property}/dataStreams/{dataStream}/measurementPro
   * tocolSecrets/{measurementProtocolSecret}
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1betaMeasurementProtocolSecret
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1betaMeasurementProtocolSecret::class);
  }
  /**
   * Returns child MeasurementProtocolSecrets under the specified parent Property.
   * (measurementProtocolSecrets.listPropertiesDataStreamsMeasurementProtocolSecre
   * ts)
   *
   * @param string $parent Required. The resource name of the parent stream.
   * Format:
   * properties/{property}/dataStreams/{dataStream}/measurementProtocolSecrets
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. If
   * unspecified, at most 10 resources will be returned. The maximum value is 10.
   * Higher values will be coerced to the maximum.
   * @opt_param string pageToken A page token, received from a previous
   * `ListMeasurementProtocolSecrets` call. Provide this to retrieve the
   * subsequent page. When paginating, all other parameters provided to
   * `ListMeasurementProtocolSecrets` must match the call that provided the page
   * token.
   * @return GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesDataStreamsMeasurementProtocolSecrets($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse::class);
  }
  /**
   * Updates a measurement protocol secret. (measurementProtocolSecrets.patch)
   *
   * @param string $name Output only. Resource name of this secret. This secret
   * may be a child of any type of stream. Format: properties/{property}/dataStrea
   * ms/{dataStream}/measurementProtocolSecrets/{measurementProtocolSecret}
   * @param GoogleAnalyticsAdminV1betaMeasurementProtocolSecret $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Omitted fields will not be updated.
   * @return GoogleAnalyticsAdminV1betaMeasurementProtocolSecret
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1betaMeasurementProtocolSecret $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1betaMeasurementProtocolSecret::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesDataStreamsMeasurementProtocolSecrets::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesDataStreamsMeasurementProtocolSecrets');
