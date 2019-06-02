import React from 'react';
import createReactClass from 'create-react-class';
import AsyncSelect from 'react-select/lib/Async';
import PropTypes from 'prop-types';

const options = [];
/**
 *  A Wiki selector component that has both single and multi mode with searchable wikis.
 */
const WikiSelect = createReactClass({
  propTypes: {
    /**
     *  If true multiple wiki can be selected.
     */
    multi: PropTypes.bool,
    /**
     *  callback(wiki); where wiki is { language, project } if multi = false else Array of { language, project }
     */
    onChange: PropTypes.func,
    /**
     *  Custom styles for the Select Widget.
     */
    styles: PropTypes.object,
    /**
     *  An array of { language, project }. Only used if multi = true
     */
    wikis: PropTypes.array
  },

  render() {
    if (options.length === 0) {
      // cache the options so it doesn't run on every render
      const languages = JSON.parse(WikiLanguages);
      const projects = JSON.parse(WikiProjects);
      for (let i = 0; i < languages.length; i += 1) {
        for (let j = 0; j < projects.length; j += 1) {
          const language = languages[i];
          const project = projects[j];
          options.push({ value: { language, project }, label: `${language}.${project}.org` });
        }
      }
    }

    let wikis = [];
    if (this.props.wikis) {
      wikis = this.props.wikis.map((wiki) => {
        return {
          value: wiki,
          label: `${wiki.language}.${wiki.project}.org`
        };
      });
    }

    const filterOptions = function (val) {
      return options.filter(wiki =>
        wiki.label.toLowerCase().includes(val.toLowerCase())
      );
    };

    const loadOptions = function (inputValue, callback) {
      if (inputValue.trim().length > 1) {
        callback(filterOptions(inputValue));
      } else {
        callback([]);
      }
    };

    return <AsyncSelect
      isMulti={this.props.multi}
      placeholder={I18n.t('multi_wiki.selector_placeholder')}
      defaultValue={wikis}
      noOptionsMessage={val => I18n.t('multi_wiki.selector_suggestion', { remaining: 2 - val.inputValue.length })}
      loadOptions={loadOptions}
      isSearchable={true}
      onChange={this.props.onChange}
      styles={this.props.styles}
      isClearable={false}
    />;
  }
}
);

export default WikiSelect;

