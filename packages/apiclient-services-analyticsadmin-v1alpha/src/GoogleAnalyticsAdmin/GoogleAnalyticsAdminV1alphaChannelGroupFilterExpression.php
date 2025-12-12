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

class GoogleAnalyticsAdminV1alphaChannelGroupFilterExpression extends \Google\Model
{
  protected $andGroupType = GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList::class;
  protected $andGroupDataType = '';
  protected $filterType = GoogleAnalyticsAdminV1alphaChannelGroupFilter::class;
  protected $filterDataType = '';
  protected $notExpressionType = GoogleAnalyticsAdminV1alphaChannelGroupFilterExpression::class;
  protected $notExpressionDataType = '';
  protected $orGroupType = GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList::class;
  protected $orGroupDataType = '';

  /**
   * @param GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList
   */
  public function setAndGroup(GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList $andGroup)
  {
    $this->andGroup = $andGroup;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList
   */
  public function getAndGroup()
  {
    return $this->andGroup;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaChannelGroupFilter
   */
  public function setFilter(GoogleAnalyticsAdminV1alphaChannelGroupFilter $filter)
  {
    $this->filter = $filter;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaChannelGroupFilter
   */
  public function getFilter()
  {
    return $this->filter;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaChannelGroupFilterExpression
   */
  public function setNotExpression(GoogleAnalyticsAdminV1alphaChannelGroupFilterExpression $notExpression)
  {
    $this->notExpression = $notExpression;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaChannelGroupFilterExpression
   */
  public function getNotExpression()
  {
    return $this->notExpression;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList
   */
  public function setOrGroup(GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList $orGroup)
  {
    $this->orGroup = $orGroup;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaChannelGroupFilterExpressionList
   */
  public function getOrGroup()
  {
    return $this->orGroup;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaChannelGroupFilterExpression::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaChannelGroupFilterExpression');
