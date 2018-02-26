import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';
import { connect } from "react-redux";

import API from '../../utils/api.js';
import { addNotification } from '../../actions/notification_actions.js';

const HeardFrom = createReactClass({
  propTypes: {
    currentUser: PropTypes.object,
    returnToParam: PropTypes.string,
    addNotification: PropTypes.func
  },

  getInitialState() {
    const user = this.props.currentUser;
    return {
      started: false,
      user,
      name: user.real_name,
      email: user.email,
      instructor: (user.permissions !== null) ? String(user.permission === 2) : null,
      heardFrom: ''
    };
  },

  // Update state when input fields change
  _handleFieldChange(field, e) {
    const obj = {};
    obj[field] = e.target.value;
    return this.setState(obj);
  },

  _handleSubmit(e) {
    e.preventDefault();
    this.setState({ sending: true });
    this.state.user.instructor = this.state.instructor === 'true';
    $('#react_root').data('current_user', this.state.user);

    return API.heardFrom({
      heardFrom: this.state.heardFrom
    })
    .then(() => {
      return browserHistory.push(`/onboarding/permissions?return_to=${decodeURIComponent(this.props.returnToParam)}`);
    }
    )
    .catch(() => {
      this.props.addNotification({
        message: I18n.t('error_500.explanation'),
        closable: true,
        type: 'error'
      });
      this.setState({ sending: false });
    });
  },

  render() {
    const submitText = this.state.sending ? 'Sending' : 'Submit';
    const disabled = this.state.sending;
    return (
      <div className="form">
        <h1>Where did you hear about Wiki Ed?</h1>
        <form className="panel" onSubmit={this._handleSubmit} ref="form">
          <div className="form-group">
            <label>Tell us about how you learnt about Wiki Ed?<span className="form-required-indicator">*</span></label>
            <textarea required className="form-control" type="text" name="heardFrom" defaultValue={this.state.heardFrom} onChange={this._handleFieldChange.bind(this, 'name')} />
            <p className="form-help-text">
                It could be anything, like from a friend, through search results etc.
            </p>
          </div>
          <button disabled={disabled} type="submit" className="button dark right">
            {submitText} <i className="icon icon-rt_arrow" />
          </button>
        </form>
      </div>
    );
  }
});

const mapDispatchToProps = { addNotification };

export default connect(null, mapDispatchToProps)(HeardFrom);
