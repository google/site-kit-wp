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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaCreateRollupPropertyResponse extends \Google\Collection
{
  protected $collection_key = 'rollupPropertySourceLinks';
  protected $rollupPropertyType = GoogleAnalyticsAdminV1alphaProperty::class;
  protected $rollupPropertyDataType = '';
  protected $rollupPropertySourceLinksType = GoogleAnalyticsAdminV1alphaRollupPropertySourceLink::class;
  protected $rollupPropertySourceLinksDataType = 'array';

  /**
   * @param GoogleAnalyticsAdminV1alphaProperty
   */
  public function setRollupProperty(GoogleAnalyticsAdminV1alphaProperty $rollupProperty)
  {
    $this->rollupProperty = $rollupProperty;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaProperty
   */
  public function getRollupProperty()
  {
    return $this->rollupProperty;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaRollupPropertySourceLink[]
   */
  public function setRollupPropertySourceLinks($rollupPropertySourceLinks)
  {
    $this->rollupPropertySourceLinks = $rollupPropertySourceLinks;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaRollupPropertySourceLink[]
   */
  public function getRollupPropertySourceLinks()
  {
    return $this->rollupPropertySourceLinks;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaCreateRollupPropertyResponse::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaCreateRollupPropertyResponse');
