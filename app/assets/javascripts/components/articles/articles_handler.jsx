import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import { connect } from "react-redux";

import ArticleList from './article_list.jsx';
import UIActions from '../../actions/ui_actions.js';
import AssignmentList from '../assignments/assignment_list.jsx';
import ServerActions from '../../actions/server_actions.js';
import AvailableArticles from '../articles/available_articles.jsx';
import CourseOresPlot from './course_ores_plot.jsx';
import CategoryHandler from '../categories/category_handler.jsx';
import { fetchArticles } from "../../actions/article_actions.js";

const ArticlesHandler = createReactClass({
  displayName: 'ArticlesHandler',

  propTypes: {
    course_id: PropTypes.string,
    current_user: PropTypes.object,
    course: PropTypes.object,
    fetchArticles: PropTypes.func,
    limitReached: PropTypes.bool,
    limit: PropTypes.number,
    articles: PropTypes.array
  },

  componentWillMount() {
    ServerActions.fetch('assignments', this.props.course_id);
    return this.props.fetchArticles(this.props.course_id, this.props.limit);
  },

  showMore() {
    return this.props.fetchArticles(this.props.course_id, this.props.limit + 100);
  },

  sortSelect(e) {
    return UIActions.sort('articles', e.target.value);
  },

  render() {
    // FIXME: These props should be required, and this component should not be
    // mounted in the first place if they are not available.
    if (!this.props.course || !this.props.course.home_wiki) { return <div />; }

    let showMoreButton;
    if (!this.props.limitReached) {
      showMoreButton = <div><button className="button ghost stacked right" onClick={this.showMore}>{I18n.t('articles.see_more')}</button></div>;
    }

    let header;
    if (Features.wikiEd) {
      header = <h3 className="tooltip-trigger">{I18n.t('metrics.articles_edited')}</h3>;
    } else {
      header = (
        <h3 className="tooltip-trigger">{I18n.t('metrics.articles_edited')}
          <span className="tooltip-indicator" />
          <div className="tooltip dark">
            <p>{I18n.t('articles.cross_wiki_tracking')}</p>
          </div>
        </h3>
      );
    }

   let categories;
   if (this.props.course.type === 'ArticleScopedProgram') {
     categories = <CategoryHandler course={this.props.course} current_user={this.props.current_user} />;
   }

    return (
      <div>
        <div id="articles">
          <div className="section-header">
            {header}
            <CourseOresPlot course={this.props.course} />
            <div className="sort-select">
              <select className="sorts" name="sorts" onChange={this.sortSelect}>
                <option value="rating_num">{I18n.t('articles.rating')}</option>
                <option value="title">{I18n.t('articles.title')}</option>
                <option value="character_sum">{I18n.t('metrics.char_added')}</option>
                <option value="view_count">{I18n.t('metrics.view')}</option>
              </select>
            </div>
          </div>
          <ArticleList articles={this.props.articles} {...this.props} />
          {showMoreButton}
        </div>
        <div id="assignments" className="mt4">
          <div className="section-header">
            <h3>{I18n.t('articles.assigned')}</h3>
          </div>
          <AssignmentList {...this.props} />
        </div>
        <AvailableArticles {...this.props} />
        {categories}
      </div>
    );
  }
});

const mapStateToProps = state => ({
  limit: state.articles.limit,
  articles: state.articles.articles,
  limitReached: state.articles.limitReached
});

const mapDispatchToProps = {
  fetchArticles
};

export default connect(mapStateToProps, mapDispatchToProps)(ArticlesHandler);
